import type { StageData } from '../stageTypes';
import { TotalRibbon } from '../TotalRibbon';
import { enabledLevels, giftsAtLevel } from '../../../state/selectors';
import { publicText } from '../../../utils/content';
import { money } from '../../../utils/format';
import { cn } from '../../../utils/cn';

export function LevelsSlide({ data }: { data: StageData }) {
  const { event } = data;
  const slide = event.slides.find((s) => s.id === 'levels');
  const levels = enabledLevels(event).slice(0, 7);
  const half = Math.ceil(levels.length / 2);
  const columns = [levels.slice(0, half), levels.slice(half)];

  return (
    <div className="absolute inset-0">
      <div className="absolute left-[120px] top-[180px] w-[1680px]">
        <h2 className="anim-rise font-display text-[88px] font-[500] leading-none tracking-[-0.015em] text-white">{slide?.title}</h2>
        <p className="anim-rise mt-5 text-[30px] text-white/65" style={{ animationDelay: '100ms' }}>
          {slide?.subtitle}
        </p>
        <div className="mt-12 grid grid-cols-2 gap-x-20">
          {columns.map((col, c) => (
            <ul key={c}>
              {col.map((l, i) => {
                const count = giftsAtLevel(event, l.id).length;
                const active = event.live.activeLevelId === l.id;
                const impact = publicText(l.impact);
                return (
                  <li
                    key={l.id}
                    className={cn('anim-rise flex items-center gap-10 border-b border-white/10 py-5', active && 'rounded-2xl border-transparent bg-brand/20 px-6')}
                    style={{ animationDelay: `${200 + (c * half + i) * 70}ms` }}
                  >
                    <span className={cn('tabular w-[300px] shrink-0 text-[64px] font-semibold leading-none', l.amount >= event.display.goldThreshold && event.display.goldThreshold > 0 ? 'text-gold' : 'text-white')}>{money(l.amount)}</span>
                    <span className="flex-1 text-[25px] leading-snug text-white/65">{impact}</span>
                    {count > 0 && <span className="tabular shrink-0 rounded-full bg-white/10 px-4 py-1 text-[20px] text-white/80">{count} tonight</span>}
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      </div>
      <TotalRibbon data={data} />
    </div>
  );
}
