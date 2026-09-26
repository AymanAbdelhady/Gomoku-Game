import type { AppState } from '../../types/index.ts';
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
      void this.flush();
      return true;
    } catch {
      this.setStatus({ error: 'Cannot reach the sync server to verify the passcode.' });
      return false;
    }
  };

  private connect() {
    this.source?.close();
    const es = new EventSource(`${this.baseUrl}/stream`);
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
