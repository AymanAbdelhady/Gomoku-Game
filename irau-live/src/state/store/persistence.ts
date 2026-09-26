import type { AppState, FundraisingEvent } from '../../types/index.ts';
import { createEvent, createInitialState, SCHEMA_VERSION } from '../../config/defaults.ts';

export const STORAGE_KEY = 'irau-live:state:v1';

export function safeRead<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function safeWrite(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Fills in any fields missing from older saved data so new settings never
 * crash an event that was configured with an earlier version.
 */
export function normaliseState(input: unknown): AppState {
  const raw = input as Partial<AppState> | null;
  if (!raw || typeof raw !== 'object' || !raw.events || typeof raw.events !== 'object') return createInitialState();
  const events: Record<string, FundraisingEvent> = {};
  for (const [id, e] of Object.entries(raw.events)) {
    const base = createEvent(e.region ?? 'VIC');
    events[id] = {
      ...base,
      ...e,
      id,
      brand: { ...base.brand, ...e.brand },
      display: { ...base.display, ...e.display },
      live: { ...base.live, ...e.live },
      demo: { ...base.demo, ...e.demo },
      slides: base.slides.map((s) => ({ ...s, ...(e.slides?.find((x) => x.id === s.id) ?? {}) })),
      donations: Array.isArray(e.donations) ? e.donations : [],
    };
  }
  if (Object.keys(events).length === 0) return createInitialState();
  const activeEventId = raw.activeEventId && events[raw.activeEventId] ? raw.activeEventId : Object.keys(events)[0];
  return { schemaVersion: SCHEMA_VERSION, activeEventId, events, rev: typeof raw.rev === 'number' ? raw.rev : 0 };
}
