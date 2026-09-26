import { useActiveEvent } from '../../state/StoreContext';
import { ScaledStage } from '../stage/ScaledStage';
import { LiveStage } from '../stage/LiveStage';
import { SLIDE_LABELS } from '../../config/campaign';
import { getActiveLevel } from '../../state/selectors';
import { money } from '../../utils/format';

/** Live, scaled mirror of exactly what the audience sees. */
export function StagePreview() {
  const event = useActiveEvent();
  const level = getActiveLevel(event);
  const label = event.live.slide === 'appeal' && level ? `Appeal · ${money(level.amount)}` : SLIDE_LABELS[event.live.slide as keyof typeof SLIDE_LABELS] ?? event.live.slide;
  return (
    <figure>
      <div className="overflow-hidden rounded-2xl ring-1 ring-slate-900/10">
        <ScaledStage className="aspect-video w-full">
          <LiveStage event={event} preview />
        </ScaledStage>
      </div>
      <figcaption className="mt-2 flex items-center justify-between text-[13px] text-slate-500">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" /> On screen now: <strong className="font-semibold text-slate-800">{label}</strong>
        </span>
        <span>Live preview</span>
      </figcaption>
    </figure>
  );
}
