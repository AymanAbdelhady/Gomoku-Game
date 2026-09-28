import type { AppState, DonorAccount, DonorSession } from '../../types/index.ts';
import type { JoinInput, JoinResult, PledgeResult } from '../pledging.ts';
import type { Action } from '../actions.ts';
import { reducer } from '../reducer.ts';
import type { EventStore, SyncStatus } from './types.ts';
import { normaliseState, safeRead, safeWrite } from './persistence.ts';
import { uid } from '../../utils/id.ts';

const CACHE_KEY = 'irau-live:server-cache:v1';
const OUTBOX_KEY = 'irau-live:outbox:v1';
const KEY_SESSION = 'irau-live:operator-key';

interface Envelope {
  id: string;
  action: Action;
}

/**
 * Multi-device realtime store backed by the bundled sync server
 * (server/index.ts): Server-Sent Events down, HTTP POST up.
 *
 *   Operator tablet ──POST /api/actions──▶ sync server ──SSE /api/stream──▶ live display(s)
 *
 * - Operator actions apply optimistically, then queue in a persisted outbox
 *   until the server confirms them, so a brief Wi-Fi drop backstage does not
 *   lose a pledge. They are replayed on reconnect (the server de-duplicates).
 * - Displays keep showing the last known state while disconnected and
 *   announce "Connection restored" when the stream resumes.
 */
export class ServerEventStore implements EventStore {
  readonly runsDemoLocally = false;
  private confirmed: AppState;
  private state: AppState;
  private outbox: Envelope[];
  private listeners = new Set<() => void>();
  private statusListeners = new Set<() => void>();
  private status: SyncStatus;
  private source: EventSource | null = null;
  private flushing = false;
  private hadConnection = false;

  private baseUrl: string;

  constructor(baseUrl: string, initial: AppState) {
    this.baseUrl = baseUrl;
    this.confirmed = initial;
    this.outbox = safeRead<Envelope[]>(OUTBOX_KEY) ?? [];
    this.state = this.rebase();
    this.status = {
      mode: 'server',
      online: false,
      pending: this.outbox.length,
      reconnects: 0,
      authorised: !!sessionStorage.getItem(KEY_SESSION),
      error: null,
    };
    this.connect();
    window.addEventListener('online', () => this.flush());
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
    this.outbox.push({ id: uid('act'), action });
    this.persistOutbox();
    this.state = this.rebase();
    this.emit();
    void this.flush();
  };

  joinAsDonor = async (input: JoinInput): Promise<JoinResult> => {
    try {
      const res = await fetch(`${this.baseUrl}/donor/join`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) });
      return (await res.json()) as JoinResult;
    } catch {
      return { ok: false, error: 'No connection — please check your Wi-Fi and try again.' };
    }
  };

  submitPledge = async (session: DonorSession, amount: number, levelId?: string): Promise<PledgeResult> => {
    try {
      const res = await fetch(`${this.baseUrl}/pledge`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ donorId: session.donorId, token: session.token, amount, levelId }),
      });
      return (await res.json()) as PledgeResult;
    } catch {
      return { ok: false, error: 'No connection — your pledge was not sent. Please try again.' };
    }
  };

  listDonors = async (): Promise<DonorAccount[]> => {
    const res = await fetch(`${this.baseUrl}/donors`, { headers: { 'x-operator-key': sessionStorage.getItem(KEY_SESSION) ?? '' }, cache: 'no-store' });
    if (!res.ok) throw new Error('Operator passcode required');
    return (await res.json()) as DonorAccount[];
  };

  publicBaseUrl = () => this.lanUrl;

  /** Uploads to the sync server so the shared state carries a short URL, not the image. */
  storeAsset = async (dataUrl: string) => {
    const res = await fetch(`${this.baseUrl}/assets`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-operator-key': sessionStorage.getItem(KEY_SESSION) ?? '' },
      body: JSON.stringify({ dataUrl }),
    });
    if (res.status === 401) throw new Error('Unlock the dashboard with the operator passcode to upload.');
    if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? 'Upload failed.');
    const { name } = (await res.json()) as { name: string };
    return `${this.baseUrl}/assets/${name}`;
  };

  /** Set from the server's health probe: an address other devices on the network can use. */
  lanUrl: string | null = null;

  authorise = async (passcode: string) => {
    try {
      const res = await fetch(`${this.baseUrl}/auth`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      if (!res.ok) return false;
      sessionStorage.setItem(KEY_SESSION, passcode);
      this.setStatus({ authorised: true, error: null });
      this.connect(); // reconnect with operator access to see pledges awaiting approval
      void this.flush();
      return true;
    } catch {
      this.setStatus({ error: 'Cannot reach the sync server to verify the passcode.' });
      return false;
    }
  };

  private connect() {
    this.source?.close();
    const key = sessionStorage.getItem(KEY_SESSION);
    const es = new EventSource(`${this.baseUrl}/stream${key ? `?key=${encodeURIComponent(key)}` : ''}`);
    this.source = es;
    es.addEventListener('state', (e) => {
      try {
        this.confirmed = normaliseState(JSON.parse((e as MessageEvent<string>).data));
        safeWrite(CACHE_KEY, this.confirmed);
        this.state = this.rebase();
        this.emit();
      } catch {
        /* ignore malformed frame */
      }
    });
    es.onopen = () => {
      const restored = this.hadConnection && !this.status.online;
      this.hadConnection = true;
      this.setStatus({ online: true, error: null, reconnects: this.status.reconnects + (restored ? 1 : 0) });
      void this.flush();
    };
    es.onerror = () => {
      // EventSource retries automatically; we only reflect the state.
      if (this.status.online) this.setStatus({ online: false });
    };
  }

  /** Confirmed server state + any actions still waiting in the outbox. */
  private rebase(): AppState {
    return this.outbox.reduce((s, env) => reducer(s, env.action), this.confirmed);
  }

  private async flush() {
    if (this.flushing || this.outbox.length === 0) return;
    this.flushing = true;
    try {
      while (this.outbox.length > 0) {
        const batch = this.outbox.slice(0, 20);
        const res = await fetch(`${this.baseUrl}/actions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-operator-key': sessionStorage.getItem(KEY_SESSION) ?? '' },
          body: JSON.stringify({ actions: batch }),
        });
        if (res.status === 401) {
          this.setStatus({ authorised: false, error: 'Operator passcode required to send changes.' });
          break;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as { state: AppState };
        const sent = new Set(batch.map((b) => b.id));
        this.outbox = this.outbox.filter((b) => !sent.has(b.id));
        this.persistOutbox();
        this.confirmed = normaliseState(body.state);
        safeWrite(CACHE_KEY, this.confirmed);
        this.state = this.rebase();
        this.emit();
      }
    } catch {
      this.setStatus({ online: false });
      window.setTimeout(() => void this.flush(), 3000);
    } finally {
      this.flushing = false;
    }
  }

  private persistOutbox() {
    safeWrite(OUTBOX_KEY, this.outbox);
    this.setStatus({ pending: this.outbox.length });
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private setStatus(patch: Partial<SyncStatus>) {
    this.status = { ...this.status, ...patch };
    this.statusListeners.forEach((l) => l());
  }

  static cachedState(): AppState | null {
    const cached = safeRead<AppState>(CACHE_KEY);
    return cached ? normaliseState(cached) : null;
  }
}
