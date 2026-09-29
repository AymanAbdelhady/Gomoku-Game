import { useEffect } from 'react';
import { useStore } from './StoreContext';
import { getActiveEvent } from './selectors';

/**
 * Drives Demo Mode ticks in the browser (local sync mode only — the sync
 * server runs its own clock). A Web Lock guarantees that only one open tab
 * runs the clock, so opening the display and the dashboard side by side does
 * not double the simulated gifts.
 */
export function useDemoRunner() {
  const store = useStore();
  useEffect(() => {
    if (!store.runsDemoLocally) return;
    let cancelled = false;
    let timer: number | undefined;

    const loop = () => {
      if (cancelled) return;
      const event = getActiveEvent(store.getState());
      if (event.demo.running) {
        store.dispatch({ type: 'demo/tick', eventId: event.id, at: Date.now(), seed: Math.floor(Math.random() * 2 ** 31) });
      }
      const next = getActiveEvent(store.getState());
      timer = window.setTimeout(loop, next.demo.running ? next.demo.intervalMs : 800);
    };

    const locks = (navigator as Navigator & { locks?: LockManager }).locks;
    if (locks) {
      const release = new AbortController();
      locks
        .request('irau-live-demo-clock', { signal: release.signal }, () => {
          loop();
          return new Promise<void>((resolve) => release.signal.addEventListener('abort', () => resolve()));
        })
        .catch(() => undefined);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
        release.abort();
      };
    }
    loop();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [store]);
}
