import type { AppState, DonorAccount, DonorSession } from '../../types/index.ts';
import { makeAccount, makePledge, pledgeError, toSession, validateJoin, type JoinInput, type JoinResult, type PledgeResult } from '../pledging.ts';
import { getActiveEvent } from '../selectors.ts';
import { uid } from '../../utils/id.ts';
import type { Action } from '../actions.ts';
import { reducer } from '../reducer.ts';
import type { EventStore, SyncStatus } from './types.ts';
import { normaliseState, safeRead, safeWrite, STORAGE_KEY } from './persistence.ts';

const CHANNEL = 'irau-live:sync';
const ACCOUNTS_KEY = 'irau-live:donor-accounts:v1';

interface StoredAccount extends DonorAccount {
  token: string;
}

/**
 * Same-browser realtime store.
 *
 * Every tab/window of this browser (e.g. the operator dashboard on the laptop
 * and the live display on the projector output) shares one state through
 * localStorage + BroadcastChannel. Works fully offline, but does NOT sync
 * between different devices — use the bundled sync server for that.
 */
export class LocalEventStore implements EventStore {
  readonly runsDemoLocally = true;
  private state: AppState;
  private listeners = new Set<() => void>();
  private statusListeners = new Set<() => void>();
  private channel: BroadcastChannel | null = null;
  private status: SyncStatus;
  private passcode: string;

  constructor(passcode: string) {
    this.passcode = passcode;
    this.state = normaliseState(safeRead(STORAGE_KEY));
    this.status = {
      mode: 'local',
      online: typeof navigator === 'undefined' ? true : navigator.onLine,
      pending: 0,
      reconnects: 0,
      authorised: false,
      error: null,
    };
    safeWrite(STORAGE_KEY, this.state);

    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL);
      this.channel.onmessage = (e: MessageEvent<{ state: AppState }>) => this.receive(e.data.state);
    }
    // Fallback for browsers without BroadcastChannel, and a second safety net.
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          this.receive(normaliseState(JSON.parse(e.newValue)));
        } catch {
          /* ignore malformed writes */
        }
      }
    });
    window.addEventListener('online', () => this.setStatus({ online: true, reconnects: this.status.reconnects + 1 }));
    window.addEventListener('offline', () => this.setStatus({ online: false }));
  }

  getState = () => this.state;
  getStatus = () => this.status;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  subscribeStatus = (listener: () => void) => {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  };

  dispatch = (action: Action) => {
    // Read-modify-write against the latest persisted copy so two tabs acting at
    // the same moment (e.g. demo clock + operator) don't overwrite each other.
    const latest = safeRead<AppState>(STORAGE_KEY);
    const base = latest && latest.rev > this.state.rev ? normaliseState(latest) : this.state;
    const next = reducer(base, action);
    if (next === base && base === this.state) return;
    this.state = next;
    if (!safeWrite(STORAGE_KEY, next)) this.setStatus({ error: 'Browser storage is full or unavailable — changes will not survive a refresh.' });
    this.channel?.postMessage({ state: next });
    this.emit();
  };

  authorise = async (passcode: string) => {
    const ok = passcode.trim().toLowerCase() === this.passcode.trim().toLowerCase();
    if (ok) this.setStatus({ authorised: true });
    return ok;
  };

  joinAsDonor = async (input: JoinInput): Promise<JoinResult> => {
    const event = getActiveEvent(this.state);
    const error = validateJoin(event, input);
    if (error) return { ok: false, error };
    const account = makeAccount(event, input, uid('donor'), Date.now());
    const token = uid('tok');
    const accounts = safeRead<StoredAccount[]>(ACCOUNTS_KEY) ?? [];
    safeWrite(ACCOUNTS_KEY, [...accounts, { ...account, token }]);
    this.dispatch({ type: 'donor/joined', eventId: event.id });
    return { ok: true, session: toSession(account, token) };
  };

  submitPledge = async (session: DonorSession, amount: number, levelId?: string): Promise<PledgeResult> => {
    const stored = (safeRead<StoredAccount[]>(ACCOUNTS_KEY) ?? []).find((a) => a.id === session.donorId && a.token === session.token);
    const event = this.state.events[session.eventId];
    const error = pledgeError(event, stored, amount, levelId);
    if (error || !event || !stored) return { ok: false, error: error ?? 'Please join again.' };
    const pledge = makePledge(event, stored, amount, uid('plg'), Date.now(), levelId);
    this.dispatch({ type: 'pledge/submit', pledge });
    const after = this.state.events[event.id];
    if (after.donations.some((d) => d.id === pledge.id)) return { ok: true, status: 'approved', pledge };
    if (after.pendingPledges.some((d) => d.id === pledge.id)) return { ok: true, status: 'pending', pledge };
    return { ok: false, error: 'Your pledge could not be recorded. Please try again.' };
  };

  listDonors = async (): Promise<DonorAccount[]> => (safeRead<StoredAccount[]>(ACCOUNTS_KEY) ?? []).map(({ token: _t, ...a }) => a);

  publicBaseUrl = () => null;

  private receive(incoming: AppState) {
    if (incoming.rev <= this.state.rev) return;
    this.state = normaliseState(incoming);
    this.emit();
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private setStatus(patch: Partial<SyncStatus>) {
    this.status = { ...this.status, ...patch };
    this.statusListeners.forEach((l) => l());
  }
}
