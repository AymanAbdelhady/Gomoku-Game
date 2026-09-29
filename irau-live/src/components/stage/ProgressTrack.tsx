import { useEffect, useRef, useState } from 'react';
import type { Milestone } from '../../types';
import { money, moneyCompact } from '../../utils/format';
import { cn } from '../../utils/cn';

interface Props {
  raised: number;
  target: number;
  milestones: Milestone[];
  /** Changes on every new gift to replay the surge effects. */
  pulseKey: string | number;
  /** Amount of the gift that caused the latest surge, for the rising "+$" label. */
  giftAmount?: number;
  size?: 'lg' | 'sm';
  showLabels?: boolean;
  /** Show "$X to go" above the next milestone. */
  showNextMilestone?: boolean;
  className?: string;
}

/**
 * The "thermometer": a luminous, gently flowing track with milestone markers.
 * On every gift the bar surges forward, the newly-filled segment flares, the
 * leading edge swells and a "+$amount" rises from it. Over-target totals keep
 * the bar full and warm it with gold.
 */
export function ProgressTrack({ raised, target, milestones, pulseKey, giftAmount, size = 'lg', showLabels = true, showNextMilestone = false, className }: Props) {
  const progress = target > 0 ? raised / target : 0;
  const pct = Math.max(Math.min(1, progress) * 100, 1.2);
  const exceeded = progress >= 1;
  const lg = size === 'lg';
  const height = lg ? 30 : 14;
  const markers = milestones.filter((m) => m.amount > 0 && m.amount < target);
  const next = markers.find((m) => m.amount > raised);
  const gain = useGain(pct, pulseKey);
  const surging = pulseKey !== 'initial';
  const pill = showNextMilestone && next ? { left: (next.amount / target) * 100 } : null;

  return (
    <div className={cn('relative w-full', className)}>
      <div
        className="relative w-full rounded-full bg-white/[0.07] ring-1 ring-inset ring-white/10"
        style={{ height }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.round(raised)}
        aria-label="Progress towards tonight's target"
      >
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden rounded-full transition-[width] duration-[1800ms] ease-[cubic-bezier(0.34,1.25,0.4,1)]"
          style={{
            width: `${pct}%`,
            background: exceeded
              ? 'linear-gradient(90deg, var(--color-brand), color-mix(in oklab, var(--color-gold) 85%, white))'
              : 'linear-gradient(90deg, color-mix(in oklab, var(--color-brand) 80%, var(--color-navy)) 0%, var(--color-brand) 55%, color-mix(in oklab, var(--color-teal) 80%, white) 100%)',
            boxShadow: `0 0 ${lg ? 46 : 20}px color-mix(in oklab, var(--color-brand) 60%, transparent)`,
          }}
        >
          {/* Slow diagonal flow, so the bar always feels alive */}
          <div className="motion-decor anim-flow absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-linear-gradient(115deg, white 0 14px, transparent 14px 38px)' }} />
          <div className="motion-decor anim-shimmer absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
        </div>

        {/* Newly-filled segment flares, then settles */}
        {gain && gain.to > gain.from && (
          <div
            key={gain.key}
            className="motion-decor pointer-events-none absolute inset-y-0 rounded-full"
            style={{
              left: `${gain.from}%`,
              width: `${gain.to - gain.from}%`,
              background: 'linear-gradient(90deg, rgba(255,255,255,.15), rgba(255,255,255,.95))',
              boxShadow: '0 0 30px 6px rgba(255,255,255,.55)',
              animation: 'gain-flare 2.8s ease-out both',
            }}
          />
        )}

        {/* Leading edge */}
        <div className="absolute top-1/2 transition-[left] duration-[1800ms] ease-[cubic-bezier(0.34,1.25,0.4,1)]" style={{ left: `${pct}%` }}>
          <span
            data-celebrate="bar-head"
            className="absolute left-0 top-0 block -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            style={{ width: height * 0.95, height: height * 0.95, boxShadow: '0 0 26px 8px rgba(255,255,255,.5)' }}
          />
          <span className="motion-decor anim-breathe absolute left-0 top-0 block -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-md" style={{ width: height * 2.4, height: height * 2.4 }} />
          {surging && (
            <>
              <span key={`bump-${pulseKey}`} className="motion-decor absolute left-0 top-0 block rounded-full bg-white" style={{ width: height * 0.95, height: height * 0.95, animation: 'head-bump 1.2s var(--ease-calm) both' }} />
              <span key={`ring-${pulseKey}`} className="motion-decor absolute left-0 top-0 block rounded-full border-2 border-white/70" style={{ width: height * 2, height: height * 2, animation: 'pulse-ring 1.6s var(--ease-calm) both' }} />
              {giftAmount ? (
                <span
                  key={`plus-${pulseKey}`}
                  className={cn('tabular absolute bottom-0 left-0 whitespace-nowrap font-bold text-white', lg ? 'text-[34px]' : 'text-[26px]')}
                  style={{ animation: 'float-up 2.6s var(--ease-calm) both', textShadow: '0 0 24px color-mix(in oklab, var(--color-brand) 80%, transparent)' }}
                >
                  +{money(giftAmount)}
                </span>
              ) : null}
            </>
          )}
        </div>

        {/* Milestone ticks */}
        {markers.map((m) => {
          const reached = raised >= m.amount;
          return (
            <span
              key={m.id}
              className={cn('absolute top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-700', reached ? 'bg-white/85 shadow-[0_0_14px_rgba(255,255,255,.7)]' : 'bg-white/25')}
              style={{ left: `${(m.amount / target) * 100}%`, width: reached ? 3 : 2, height: height + (lg ? 18 : 8) }}
            />
          );
        })}
      </div>

      {showLabels && (
        <div className="relative mt-5 h-8">
          {!(pill && pill.left < 12) && <span className="tabular absolute left-0 text-[22px] font-medium text-white/40">$0</span>}
          {markers.map((m) => {
            const left = (m.amount / target) * 100;
            if (left < 5 || left > 92) return null;
            // Make room for the countdown pill: hide plain labels right next to it.
            if (pill && m.id !== next?.id && Math.abs(left - pill.left) < 11) return null;
            if (showNextMilestone && next && m.id === next.id) {
              // The next milestone reads as a live countdown: "$100K · $13,950 to go".
              return (
                <span key={m.id} className="absolute -top-1.5 -translate-x-1/2 transition-[left] duration-700" style={{ left: `${left}%` }}>
                  <span className="tabular anim-breathe-soft inline-flex items-center gap-2.5 whitespace-nowrap rounded-full bg-white/[0.12] px-4 py-1 text-[21px] ring-1 ring-white/25">
                    <span className="font-semibold text-white">{moneyCompact(m.amount)}</span>
                    <span className="text-white/65">{money(m.amount - raised)} to go</span>
                  </span>
                </span>
              );
            }
            return (
              <span
                key={m.id}
                className={cn('tabular absolute -translate-x-1/2 text-[22px] font-medium transition-colors duration-700', raised >= m.amount ? 'text-white/90' : 'text-white/40')}
                style={{ left: `${left}%` }}
              >
                {moneyCompact(m.amount)}
              </span>
            );
          })}
          <span className="tabular absolute right-0 text-[22px] font-semibold text-white/80">{moneyCompact(target)}</span>
        </div>
      )}
    </div>
  );
}

/** Where the bar was before the latest gift, so the new segment can flare. */
function useGain(pct: number, pulseKey: string | number) {
  const history = useRef({ prev: pct, cur: pct });
  const [gain, setGain] = useState<{ from: number; to: number; key: string } | null>(null);
  useEffect(() => {
    history.current = { prev: history.current.cur, cur: pct };
  }, [pct]);
  useEffect(() => {
    if (pulseKey === 'initial') return;
    setGain({ from: history.current.prev, to: history.current.cur, key: String(pulseKey) });
  }, [pulseKey]);
  return gain;
}
