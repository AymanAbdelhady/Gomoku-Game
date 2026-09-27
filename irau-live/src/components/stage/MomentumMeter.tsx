import type { Donation } from '../../types';
import { cn } from '../../utils/cn';

const BUCKETS = 12;
const BUCKET_MS = 60_000;

/**
 * "Giving right now": gifts per minute over the last 12 minutes as a live
 * mini bar chart. The current minute's bar grows with each gift.
 */
export function MomentumMeter({ donations, now, pulseKey }: { donations: Donation[]; now: number; pulseKey: string | number }) {
  const counts = new Array<number>(BUCKETS).fill(0);
  let recent = 0;
  const t = Math.max(now, Date.now());
  for (let i = donations.length - 1; i >= 0; i--) {
    const age = t - donations[i].timestamp;
    if (age < 0) continue;
    if (age >= BUCKETS * BUCKET_MS) break;
    counts[BUCKETS - 1 - Math.floor(age / BUCKET_MS)]++;
    if (age < 10 * BUCKET_MS) recent++;
  }
  const max = Math.max(3, ...counts);

  return (
    <div className="flex items-end gap-5" aria-label={`${recent} gifts in the last 10 minutes`}>
      <div className="flex h-[56px] items-end gap-[5px]" aria-hidden="true">
        {counts.map((c, i) => {
          const current = i === BUCKETS - 1;
          return (
            <span
              key={current ? `cur-${pulseKey}` : i}
              className={cn('w-[11px] origin-bottom rounded-full transition-[height] duration-700', current ? 'bg-teal shadow-[0_0_14px_var(--color-teal)]' : 'bg-white/30')}
              style={{ height: `${Math.max(6, (c / max) * 56)}px`, animation: current ? 'bar-grow .8s var(--ease-calm) both' : undefined }}
            />
          );
        })}
      </div>
      <div>
        <p className="tabular text-[54px] font-semibold leading-none text-white">
          <span key={pulseKey} className="anim-count-pop">{recent}</span>
        </p>
        <p className="eyebrow mt-3 whitespace-nowrap text-[17px] text-white/50">Gifts · last 10 min</p>
      </div>
    </div>
  );
}
