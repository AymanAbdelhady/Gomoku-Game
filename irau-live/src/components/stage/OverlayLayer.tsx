import { useEffect, useRef, useState } from 'react';
import type { Overlay } from '../../types';
import { money } from '../../utils/format';
import { cn } from '../../utils/cn';
import { Rings } from './slides/GratitudeSlides';

const DURATION: Record<Overlay['kind'], number> = { milestone: 9000, thankyou: 7000 };
const MAX_QUEUE = 3;

/**
 * Plays milestone and thank-you moments one at a time.
 * Overlays that already existed when the screen opened are never replayed,
 * and the operator can dismiss everything with "Clear overlays".
 */
export function useOverlayQueue(overlays: Overlay[]) {
  const seen = useRef<Set<string> | null>(null);
  const [queue, setQueue] = useState<Overlay[]>([]);
  const [leaving, setLeaving] = useState(false);

  if (seen.current === null) seen.current = new Set(overlays.map((o) => o.id));

  useEffect(() => {
    const ids = new Set(overlays.map((o) => o.id));
    const fresh = overlays.filter((o) => !seen.current!.has(o.id));
    fresh.forEach((o) => seen.current!.add(o.id));
    setQueue((q) => {
      const kept = q.filter((o) => ids.has(o.id)); // operator cleared → drop
      return [...kept, ...fresh].slice(0, MAX_QUEUE);
    });
  }, [overlays]);

  const current = queue[0] ?? null;

  useEffect(() => {
    if (!current) return;
    setLeaving(false);
    const d = DURATION[current.kind];
    const t1 = window.setTimeout(() => setLeaving(true), d - 700);
    const t2 = window.setTimeout(() => setQueue((q) => q.filter((o) => o.id !== current.id)), d);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [current]);

  return { current, leaving };
}

const ARABIC: Record<string, string> = {
  alhamdulillah: 'الحمد لله',
  'jazakum allahu khairan': 'جزاكم الله خيرًا',
};

export function OverlayView({ overlay, leaving }: { overlay: Overlay; leaving: boolean }) {
  const arabic = ARABIC[overlay.headline.trim().toLowerCase()];
  const milestone = overlay.kind === 'milestone';
  return (
    <div
      role="status"
      aria-live="assertive"
      className={cn('absolute inset-0 z-40 flex flex-col items-center justify-center text-center transition-opacity duration-700', leaving ? 'opacity-0' : 'anim-slide-in opacity-100')}
    >
      <div className="absolute inset-0 bg-[#050d1f]/70" />
      <Rings gold={milestone} />
      <div className="relative flex flex-col items-center">
        {arabic && (
          <p lang="ar" dir="rtl" className="anim-rise font-arabic text-[76px] leading-none text-gold">
            {arabic}
          </p>
        )}
        <p className={cn('anim-rise eyebrow mt-8 text-white', milestone ? 'text-[48px] tracking-[0.34em]' : 'font-display text-[88px] normal-case tracking-normal')} style={{ animationDelay: '150ms' }}>
          {overlay.headline}
        </p>
        <p className={cn('anim-rise tabular mt-8 font-semibold leading-none tracking-[-0.04em] text-glow', milestone ? 'text-[250px] text-white' : 'text-[210px] text-gold')} style={{ animationDelay: '320ms' }}>
          {money(overlay.amount)}
        </p>
        {milestone ? (
          <p className="anim-rise eyebrow mt-4 text-[54px] tracking-[0.3em] text-white/85" style={{ animationDelay: '420ms' }}>
            Raised
          </p>
        ) : (
          overlay.name && (
            <p className="anim-rise mt-6 text-[52px] font-medium text-white" style={{ animationDelay: '420ms' }}>
              {overlay.name}
            </p>
          )
        )}
        <p className="anim-rise mt-10 max-w-[1300px] font-display text-[46px] italic leading-snug text-white/75" style={{ animationDelay: '560ms' }}>
          {overlay.message}
        </p>
      </div>
    </div>
  );
}
