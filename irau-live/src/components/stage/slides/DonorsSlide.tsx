import type { StageData } from '../stageTypes';
import { TotalRibbon } from '../TotalRibbon';
import { recentDonations } from '../../../state/selectors';
import { publicDonorName } from '../../../utils/content';
import { money } from '../../../utils/format';
import { timeAgo } from '../../../utils/time';
import { cn } from '../../../utils/cn';

export function DonorsSlide({ data }: { data: StageData }) {
  const { event, now } = data;
  const slide = event.slides.find((s) => s.id === 'donors');
  const donors = recentDonations(event, 15);

  return (
    <div className="absolute inset-0">
      <div className="absolute left-[120px] top-[180px] w-[1680px]">
        <div className="flex items-end justify-between">
          <h2 className="anim-rise font-display text-[88px] font-[500] leading-none tracking-[-0.015em] text-white">{slide?.title}</h2>
          <p className="eyebrow text-[22px] text-teal">{slide?.subtitle}</p>
        </div>
        {donors.length === 0 ? (
          <p className="mt-16 font-display text-[40px] italic text-white/50">The first gift of the evening will appear here.</p>
        ) : (
          <ol className="mt-12 grid grid-cols-3 gap-x-10 gap-y-4" aria-label="Recent donors">
            {donors.map((d, i) => {
              const gold = event.display.goldThreshold > 0 && d.amount >= event.display.goldThreshold;
              return (
                <li key={d.id} className={cn('anim-chip-in flex items-center justify-between rounded-2xl px-7 py-5 ring-1', gold ? 'bg-gold/10 ring-gold/30' : 'bg-white/[0.04] ring-white/10')} style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="min-w-0">
                    <p className="truncate text-[29px] font-medium text-white">{publicDonorName(d)}</p>
                    <p className="text-[18px] text-white/45">{timeAgo(d.timestamp, now)}</p>
                  </div>
                  {event.display.showAmounts && <span className={cn('tabular text-[30px] font-semibold', gold ? 'text-gold' : 'text-white/90')}>{money(d.amount)}</span>}
                </li>
              );
            })}
          </ol>
        )}
      </div>
      <TotalRibbon data={data} />
    </div>
  );
}
