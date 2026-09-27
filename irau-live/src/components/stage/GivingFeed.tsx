import { useEffect, useRef } from 'react';
import type { Donation } from '../../types';
import { publicDonorName } from '../../utils/content';
import { money } from '../../utils/format';
import { timeAgo } from '../../utils/time';
import { cn } from '../../utils/cn';

const ROW_H = 92;

/**
 * Quiet, dignified list of recent gifts. New gifts ease in at the top while
 * the list glides down; older entries fade away at the bottom.
 */
export function GivingFeed({ donations, now, showAmounts, goldThreshold, rows = 5, reduced }: { donations: Donation[]; now: number; showAmounts: boolean; goldThreshold: number; rows?: number; reduced: boolean }) {
  const list = donations.slice(0, rows + 1);
  const newestId = list[0]?.id;
  const listRef = useRef<HTMLOListElement>(null);
  const prevNewest = useRef(newestId);

  useEffect(() => {
    if (prevNewest.current && newestId && prevNewest.current !== newestId && !reduced) {
      listRef.current?.animate([{ transform: `translateY(-${ROW_H}px)` }, { transform: 'translateY(0)' }], { duration: 900, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    }
    prevNewest.current = newestId;
  }, [newestId, reduced]);

  if (list.length === 0) {
    return <p className="font-display text-[30px] italic text-white/45">The first gift of the evening will appear here.</p>;
  }

  return (
    <div className="relative overflow-hidden" style={{ height: ROW_H * rows, maskImage: 'linear-gradient(to bottom, black 70%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent)' }}>
      <ol ref={listRef} aria-label="Recent giving" className="relative">
        {list.map((d, i) => {
          const fresh = now - d.timestamp < 6000;
          const gold = d.amount >= goldThreshold && goldThreshold > 0;
          return (
            <li
              key={d.id}
              data-celebrate={i === 0 ? 'feed-top' : undefined}
              className={cn('-mx-6 flex items-center justify-between gap-6 rounded-2xl px-6', i === 0 && fresh && 'anim-feed-glow')}
              style={{ height: ROW_H, opacity: i === 0 && fresh ? undefined : 1 - i * 0.1 }}
            >
              <div className={cn('min-w-0', i === 0 && fresh && 'anim-feed-in')}>
                <p className="truncate text-[32px] font-medium leading-tight text-white">{publicDonorName(d)}</p>
                <p className="text-[19px] font-medium text-white/45">{timeAgo(d.timestamp, now)}</p>
              </div>
              {showAmounts && (
                <span className={cn('tabular shrink-0 text-[34px] font-semibold', gold ? 'text-gold' : 'text-white')}>{money(d.amount)}</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
