import { useEffect, useMemo, useRef, useState } from 'react';
import type { Donation, FundraisingEvent } from '../../../types';
import type { Gift } from '../stageTypes';

/** How recent a pledge must be to be celebrated when it arrives (avoids replaying history). */
const CELEBRATE_WINDOW_MS = 60_000;

/**
 * Plays new pledges one at a time. When a rush of phone pledges lands
 * together, each still gets its own spotlight and celebration — the queue
 * simply moves faster the longer it gets.
 *
 * Returns the pledge in the spotlight now and those still waiting; the stage
 * holds waiting pledges back from the total, bar and feed so the numbers
 * move exactly as each card lands.
 */
export function useGiftQueue(event: FundraisingEvent, reduced: boolean): { gift: Gift | null; waiting: Donation[] } {
  const known = useRef<Set<string> | null>(null);
  if (known.current === null) known.current = new Set(event.donations.map((d) => d.id));
  const [queue, setQueue] = useState<Donation[]>([]);
  const [gift, setGift] = useState<Gift | null>(null);
  const [dwelling, setDwelling] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const fresh = event.donations.filter((d) => !known.current!.has(d.id));
    fresh.forEach((d) => known.current!.add(d.id));
    const recent = fresh.filter((d) => Date.now() - d.timestamp < CELEBRATE_WINDOW_MS).sort((a, b) => a.timestamp - b.timestamp);
    if (recent.length) setQueue((q) => [...q, ...recent]);
  }, [event.donations]);

  const present = useMemo(() => new Set(event.donations.map((d) => d.id)), [event.donations]);
  const waiting = useMemo(() => queue.filter((d) => present.has(d.id)), [queue, present]);

  useEffect(() => {
    if (dwelling || waiting.length === 0) return;
    const next = waiting[0];
    setQueue((q) => q.filter((d) => d.id !== next.id));
    setGift({ donation: next, key: `${next.id}-${Date.now()}` });
    setDwelling(true);
    const n = waiting.length;
    const dwell = reduced ? 500 : n > 8 ? 850 : n > 4 ? 1200 : n > 1 ? 1700 : 2300;
    timer.current = window.setTimeout(() => setDwelling(false), dwell);
  }, [dwelling, waiting, reduced]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const current = gift && present.has(gift.donation.id) ? gift : null;
  return { gift: current, waiting };
}
