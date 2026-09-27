import type { StageData } from './stageTypes';
import { AnimatedAmount } from './AnimatedAmount';
import { ProgressTrack } from './ProgressTrack';
import { Pop } from './Pop';
import { enabledMilestones } from '../../state/selectors';
import { formatNumber, money, percent } from '../../utils/format';

/** Keeps the live total visible on every secondary slide. */
export function TotalRibbon({ data }: { data: StageData }) {
  const { event, totals, reduced, pulseKey, gift, now } = data;
  const fresh = gift && now - gift.donation.timestamp < 15_000 ? gift : null;
  return (
    <div className="absolute inset-x-[120px] bottom-[60px] flex items-center gap-12">
      <div className="shrink-0">
        <p className="eyebrow text-[16px] text-teal">Raised tonight</p>
        <Pop trigger={pulseKey} celebrate="total" scale={1.08}>
          <AnimatedAmount value={totals.raised} reduced={reduced} className="mt-1 text-[64px] font-semibold tracking-[-0.02em] text-white" />
        </Pop>
      </div>
      <div className="flex-1">
        <div className="mb-4 flex items-baseline justify-between text-[22px] text-white/60">
          <span className="tabular">
            <span className="font-semibold text-white">{percent(totals.progress)}</span> of {money(totals.target)}
          </span>
          <span className="tabular">
            <span className="font-semibold text-white">{formatNumber(totals.donorCount)}</span> {totals.donorCount === 1 ? 'donor' : 'donors'}
          </span>
        </div>
        <ProgressTrack raised={totals.raised} target={totals.target} milestones={enabledMilestones(event)} pulseKey={pulseKey} giftAmount={fresh?.donation.amount} size="sm" showLabels={false} />
      </div>
    </div>
  );
}
