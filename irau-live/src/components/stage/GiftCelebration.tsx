import { useMemo } from 'react';
import type { Gift } from './stageTypes';
import { mulberry32 } from '../../utils/random';

/** Soft golden light rising behind the total for major gifts. Decorative; hidden with reduced motion. */
export function GoldMotes({ gift }: { gift: Gift | null }) {
  const motes = useMemo(() => {
    if (!gift) return [];
    const rand = mulberry32(gift.key.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
    return Array.from({ length: 26 }, (_, i) => ({
      i,
      left: 4 + rand() * 88,
      bottom: rand() * 30,
      size: 4 + rand() * 9,
      delay: rand() * 1.6,
      dur: 3.2 + rand() * 2.4,
      dx: (rand() - 0.5) * 120,
    }));
  }, [gift]);
  if (!gift) return null;
  return (
    <div key={gift.key} className="motion-decor pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute left-[10%] top-[20%] h-[560px] w-[900px] rounded-full bg-gold/25 blur-[120px]" style={{ animation: 'bloom 4.5s ease-out both' }} />
      {motes.map((m) => (
        <span
          key={m.i}
          className="absolute rounded-full bg-gold"
          style={{
            left: `${m.left}%`,
            bottom: `${m.bottom}%`,
            width: m.size,
            height: m.size,
            boxShadow: '0 0 18px 4px color-mix(in oklab, var(--color-gold) 70%, transparent)',
            ['--dx' as string]: `${m.dx}px`,
            animation: `mote ${m.dur}s ${m.delay}s ease-out both`,
          }}
        />
      ))}
    </div>
  );
}

export function HeartIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-9.4-9.3C1.2 7.7 3.4 4 7 4c2 0 3.6 1.1 5 2.8C13.4 5.1 15 4 17 4c3.6 0 5.8 3.7 4.4 7.2-1.9 4.7-9.4 9.3-9.4 9.3z" />
    </svg>
  );
}
