import type { Milestone } from '../../types';
import { moneyCompact } from '../../utils/format';
import { cn } from '../../utils/cn';

interface Props {
  raised: number;
  target: number;
  milestones: Milestone[];
  /** Changes on every new gift to replay the leading-edge pulse. */
  pulseKey: string | number;
  size?: 'lg' | 'sm';
  showLabels?: boolean;
  className?: string;
}

/**
 * The "thermometer": a wide luminous track with milestone markers.
 * Over-target totals keep the bar full and warm it with gold.
 */
export function ProgressTrack({ raised, target, milestones, pulseKey, size = 'lg', showLabels = true, className }: Props) {
  const progress = target > 0 ? raised / target : 0;
  const pct = Math.min(1, progress) * 100;
  const exceeded = progress >= 1;
  const height = size === 'lg' ? 26 : 14;
  const markers = milestones.filter((m) => m.amount > 0 && m.amount < target);

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
          className="absolute inset-y-0 left-0 overflow-hidden rounded-full transition-[width] duration-[1800ms] ease-[var(--ease-calm)]"
          style={{
            width: `${Math.max(pct, 1.2)}%`,
            background: exceeded
              ? 'linear-gradient(90deg, var(--color-brand), color-mix(in oklab, var(--color-gold) 85%, white))'
              : 'linear-gradient(90deg, color-mix(in oklab, var(--color-brand) 80%, var(--color-navy)) 0%, var(--color-brand) 55%, color-mix(in oklab, var(--color-teal) 80%, white) 100%)',
            boxShadow: `0 0 ${size === 'lg' ? 42 : 20}px color-mix(in oklab, var(--color-brand) 55%, transparent)`,
          }}
        >
          <div className="motion-decor anim-shimmer absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>

        {/* Leading edge */}
        <div className="absolute top-1/2 transition-[left] duration-[1800ms] ease-[var(--ease-calm)]" style={{ left: `${Math.max(pct, 1.2)}%` }}>
          <span
            className="absolute left-0 top-0 block -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            style={{ width: height * 0.9, height: height * 0.9, boxShadow: '0 0 24px 6px rgba(255,255,255,.45)' }}
          />
          <span
            key={pulseKey}
            className="motion-decor absolute left-0 top-0 block rounded-full border-2 border-white/70"
            style={{ width: height * 2, height: height * 2, animation: 'pulse-ring 1.6s var(--ease-calm) both' }}
          />
        </div>

        {/* Milestone ticks */}
        {markers.map((m) => {
          const reached = raised >= m.amount;
          return (
            <span
              key={m.id}
              className={cn('absolute top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-700', reached ? 'bg-white/80' : 'bg-white/25')}
              style={{ left: `${(m.amount / target) * 100}%`, width: 2, height: height + (size === 'lg' ? 18 : 8) }}
            />
          );
        })}
      </div>

      {showLabels && (
        <div className="relative mt-5 h-8">
          <span className="tabular absolute left-0 text-[22px] font-medium text-white/40">$0</span>
          {markers.map((m) => {
            const left = (m.amount / target) * 100;
            if (left < 5 || left > 92) return null;
            return (
              <span
                key={m.id}
                className={cn('tabular absolute -translate-x-1/2 text-[22px] font-medium transition-colors duration-700', raised >= m.amount ? 'text-white/85' : 'text-white/40')}
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
