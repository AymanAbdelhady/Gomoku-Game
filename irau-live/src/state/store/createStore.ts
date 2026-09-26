import type { EventStore } from './types.ts';
import { LocalEventStore } from './localStore.ts';
import { ServerEventStore } from './serverStore.ts';
import { normaliseState } from './persistence.ts';

const MODE = (import.meta.env.VITE_SYNC_MODE ?? 'auto') as 'auto' | 'local' | 'server';
const SYNC_URL = (import.meta.env.VITE_SYNC_URL as string | undefined)?.replace(/\/$/, '') || './api';
/** PROTOTYPE ONLY — visible in the bundle. Real auth belongs on the server (see README). */
const PASSCODE = (import.meta.env.VITE_ADMIN_PASSCODE as string | undefined) || 'gaza';

interface Health {
  ok: boolean;
  service?: string;
}

async function probe(url: string, timeoutMs: number): Promise<Health | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${url}/health`, { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return null;
    const body = (await res.json()) as Health;
    return body.ok && body.service === 'irau-live-sync' ? body : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Chooses the realtime backend.
 *  - `server`: the bundled sync server (multi-device, e.g. tablet backstage → projector laptop)
 *  - `local`:  same-browser sync (static hosting, one laptop driving the projector)
 *  - `auto`:   use the server when one answers at /api, otherwise local.
 */
export async function createStore(): Promise<EventStore> {
  if (MODE !== 'local') {
    const health = await probe(SYNC_URL, MODE === 'server' ? 5000 : 1200);
    if (health) {
      try {
        const res = await fetch(`${SYNC_URL}/state`, { cache: 'no-store' });
        const initial = normaliseState(await res.json());
        return new ServerEventStore(SYNC_URL, initial);
      } catch {
        /* fall through */
      }
    }
    // This device has used the sync server before but it is unreachable right now:
    // show the last known state and keep retrying, rather than silently forking into local mode.
    const cached = ServerEventStore.cachedState();
    if (cached) return new ServerEventStore(SYNC_URL, cached);
  }
  return new LocalEventStore(PASSCODE);
}
