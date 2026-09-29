import { useActiveEvent, useDispatch } from '../../state/StoreContext';
import { enabledLevels, getActiveLevel, giftsAtLevel } from '../../state/selectors';
import { money } from '../../utils/format';
import { isPlaceholder } from '../../utils/content';
import { Button, Card } from '../ui/primitives';
import { Icon } from '../ui/Icon';
import { cn } from '../../utils/cn';

/** One tap puts "Who will help us reach $X?" on the big screen. */
export function LevelControl() {
  const event = useActiveEvent();
  const dispatch = useDispatch();
  const active = getActiveLevel(event);
  const levels = enabledLevels(event);
  const activeGifts = active ? giftsAtLevel(event, active.id) : [];

  return (
    <Card
      eyebrow="Fundraising appeal"
      title={active ? <>Current level: <span className="tabular text-brand">{money(active.amount)}</span></> : 'Fundraising level'}
      actions={
        active && (
          <Button size="sm" variant="danger" onClick={() => dispatch({ type: 'live/level', eventId: event.id, levelId: null })} title="Alt+L">
            <Icon name="stop" className="h-4 w-4" /> End appeal
          </Button>
        )
      }
    >
      {active && (
        <div className="mb-4 rounded-2xl bg-navy p-4 text-white">
          <p className="text-sm text-white/70">On screen: “{event.display.appealPrompt.replace('{amount}', money(active.amount))}”</p>
          <p className="mt-1 text-[15px]">
            <strong className="tabular">{activeGifts.length}</strong> {activeGifts.length === 1 ? 'pledge' : 'pledges'} at this level ·{' '}
            <strong className="tabular">{money(activeGifts.reduce((s, d) => s + d.amount, 0))}</strong>
          </p>
          {isPlaceholder(active.impact) && <p className="mt-2 text-xs text-amber-200">No confirmed impact line for this level — none is shown on screen.</p>}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {levels.map((l) => {
          const on = active?.id === l.id;
          return (
            <button
              key={l.id}
              onClick={() => dispatch({ type: 'live/level', eventId: event.id, levelId: on ? null : l.id })}
              aria-pressed={on}
              className={cn(
                'tabular flex h-14 items-center justify-center gap-2 rounded-xl text-[17px] font-bold transition',
                on ? 'bg-brand text-white shadow-lg shadow-brand/30' : 'bg-white text-navy ring-1 ring-inset ring-slate-200 hover:ring-brand/60',
              )}
            >
              {on && <span className="anim-live-dot h-2 w-2 rounded-full bg-white" aria-hidden="true" />}
              {money(l.amount)}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[13px] text-slate-500">Tap a level to activate it on the live screen; tap again (or Alt+L) to return to the main screen.</p>
    </Card>
  );
}
