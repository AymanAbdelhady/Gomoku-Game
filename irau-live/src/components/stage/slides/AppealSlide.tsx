import type { StageData } from '../stageTypes';
import { TotalRibbon } from '../TotalRibbon';
import { getActiveLevel, giftsAtLevel, impactFor } from '../../../state/selectors';
import { publicDonorName } from '../../../utils/content';
import { money } from '../../../utils/format';
import { cn } from '../../../utils/cn';

/** "Who will help us reach $10,000?" — the stage appeal moment. */
export function AppealSlide({ data }: { data: StageData }) {
  const { event } = data;
  const level = getActiveLevel(event);
  if (!level) return null;
  const gold = event.display.goldThreshold > 0 && level.amount >= event.display.goldThreshold;
  const [before, after = ''] = (event.display.appealPrompt || 'Who will help us reach {amount}?').split('{amount}');
  const impact = impactFor(event, level.amount);
  const pledges = giftsAtLevel(event, level.id).slice().reverse();
  const shown = pledges.slice(0, 7);

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0" style={{ background: `radial-gradient(1000px 640px at 50% 44%, color-mix(in oklab, var(${gold ? '--color-gold' : '--color-brand'}) 22%, transparent), transparent 70%)` }} />

      <div key={level.id} className="absolute inset-x-[120px] top-[190px] flex flex-col items-center text-center">
        <p className="eyebrow anim-rise text-[22px] text-teal">A moment of giving</p>
        {before.trim() && (
          <p className="anim-rise mt-8 font-display text-[76px] font-[480] leading-tight text-white" style={{ animationDelay: '120ms' }}>
            {before.trim()}
          </p>
        )}
        <p
          data-celebrate="focus"
          className={cn('anim-rise tabular text-[250px] font-semibold leading-[1] tracking-[-0.04em]', gold ? 'text-gold' : 'text-white', 'text-glow')}
          style={{ animationDelay: '260ms' }}
        >
          {money(level.amount)}
          {after && <span className="font-display font-[400] text-white/55">{after.trim()}</span>}
        </p>
        {impact && (
          <p className="anim-rise mt-6 font-display text-[40px] italic text-teal" style={{ animationDelay: '420ms' }}>
            {impact}
          </p>
        )}
      </div>

      <div className="absolute inset-x-[120px] top-[760px] flex min-h-[80px] items-center justify-center gap-4">
        {pledges.length === 0 ? (
          <p className="anim-breathe text-[28px] text-white/55">
            Raise your hand{event.pledging.enabled ? <>, or pledge from your phone with code <strong className="tabular tracking-[0.12em] text-white">{event.pledging.code}</strong></> : ''}.
          </p>
        ) : (
          <>
            <span className="eyebrow mr-4 text-[20px] text-white/55">
              {pledges.length} {pledges.length === 1 ? 'pledge' : 'pledges'} at this level
            </span>
            {shown.map((d) => (
              <span key={d.id} className={cn('anim-chip-in rounded-full px-6 py-3 text-[26px] font-medium ring-1', gold ? 'bg-gold/15 text-white ring-gold/40' : 'bg-white/10 text-white ring-white/15')}>
                {publicDonorName(d)}
              </span>
            ))}
            {pledges.length > shown.length && <span className="text-[26px] text-white/60">+{pledges.length - shown.length}</span>}
          </>
        )}
      </div>

      <TotalRibbon data={data} />
    </div>
  );
}
