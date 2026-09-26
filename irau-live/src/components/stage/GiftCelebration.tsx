import { useMemo } from 'react';
import type { Gift } from './stageTypes';
import { publicDonorName } from '../../utils/content';
import { money } from '../../utils/format';
import { mulberry32 } from '../../utils/random';
import { cn } from '../../utils/cn';

/** A gentle "+$5,000 · Anonymous" acknowledgement that rises beside the total, with the gift's impact line. */
export function GiftToast({ gift, impact, gold, visible }: { gift: Gift | null; impact: string; gold: boolean; visible: boolean }) {
  if (!gift) return null;
  return (
    <div
      key={gift.key}
      aria-live="polite"
      className={cn('anim-rise flex items-center gap-8 transition-all duration-700', visible ? 'opacity-100' : 'pointer-events-none -translate-y-3 opacity-0')}
    >
      <div className={cn('inline-flex shrink-0 items-center gap-5 rounded-full py-3 pl-4 pr-8 ring-1 backdrop-blur-md', gold ? 'bg-gold/15 ring-gold/40' : 'bg-white/[0.08] ring-white/15')}>
        <span className={cn('grid h-12 w-12 place-items-center rounded-full', gold ? 'bg-gold text-ink' : 'bg-brand text-white')} aria-hidden="true">
          <HeartIcon />
        </span>
        <span className={cn('tabular text-[38px] font-semibold', gold ? 'text-gold' : 'text-white')}>+{money(gift.donation.amount)}</span>
        <span className="max-w-[380px] truncate text-[30px] text-white/70">{publicDonorName(gift.donation)}</span>
      </div>
      {impact && <p className="font-display text-[29px] italic leading-tight text-teal">{impact}</p>}
    </div>
  );
}

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
