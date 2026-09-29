import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

/** Re-renders every `intervalMs` — for "12 seconds ago" labels. */
export function useNow(intervalMs = 5000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

const motionQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      motionQuery?.addEventListener('change', cb);
      return () => motionQuery?.removeEventListener('change', cb);
    },
    () => motionQuery?.matches ?? false,
  );
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Smoothly counts from the previous value to the new one. Large jumps take a
 * little longer so the audience can follow the change; reduced motion jumps.
 */
export function useAnimatedNumber(value: number, reduced: boolean, baseMs = 1400): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frame = useRef<number | undefined>(undefined);
  const displayRef = useRef(value);

  useEffect(() => {
    if (reduced) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }
    const from = displayRef.current;
    fromRef.current = from;
    const delta = value - from;
    if (delta === 0) return;
    const duration = Math.min(2600, baseMs + Math.log10(Math.abs(delta) + 1) * 180);
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const v = from + delta * easeOutExpo(t);
      displayRef.current = v;
      setDisplay(v);
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value, reduced, baseMs]);

  return display;
}

/** Hides the mouse cursor after a period of inactivity (for the projector). */
export function useIdleCursor(ms = 2500) {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let timer = window.setTimeout(() => setIdle(true), ms);
    const wake = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), ms);
    };
    window.addEventListener('mousemove', wake);
    window.addEventListener('keydown', wake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('mousemove', wake);
      window.removeEventListener('keydown', wake);
    };
  }, [ms]);
  return idle;
}

/** True for `ms` after `key` changes to a non-null value — drives short-lived celebrations. */
export function useGiftWindow(key: string | null, ms: number): boolean {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!key) {
      setActive(false);
      return;
    }
    setActive(true);
    const t = window.setTimeout(() => setActive(false), ms);
    return () => window.clearTimeout(t);
  }, [key, ms]);
  return active;
}
