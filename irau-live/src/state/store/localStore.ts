import type { AppState } from '../../types/index.ts';
import type { Action } from '../actions.ts';
import { reducer } from '../reducer.ts';
import type { EventStore, SyncStatus } from './types.ts';
import { normaliseState, safeRead, safeWrite, STORAGE_KEY } from './persistence.ts';

const CHANNEL = 'irau-live:sync';

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
