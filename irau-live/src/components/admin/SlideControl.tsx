import { useState } from 'react';
import type { CelebrationLevel, LiveSlide } from '../../types';
import { useActiveEvent, useDispatch } from '../../state/StoreContext';
import { enabledMilestones, lastReachedMilestone, recentDonations } from '../../state/selectors';
import { SLIDE_LABELS, SLIDE_ORDER } from '../../config/campaign';
import { money } from '../../utils/format';
import { Button, Card, Segmented } from '../ui/primitives';
import { Icon, type IconName } from '../ui/Icon';
import { cn } from '../../utils/cn';

const ICONS: Record<LiveSlide['id'], IconName> = {
  main: 'gauge',
  impact: 'heartPulse',
  levels: 'layers',
  donors: 'users',
  qr: 'qr',
  thankyou: 'sparkle',
  milestone: 'flag',
};

export function SlideControl() {
  const event = useActiveEvent();
  const dispatch = useDispatch();
  const paused = event.status === 'paused';
  const slides = SLIDE_ORDER.map((id) => event.slides.find((s) => s.id === id)!).filter((s) => s && s.enabled);
  const milestones = enabledMilestones(event);
  const [milestoneId, setMilestoneId] = useState('');
  const chosenMilestone = milestones.find((m) => m.id === milestoneId) ?? lastReachedMilestone(event) ?? milestones[0];
  const lastGift = recentDonations(event, 1)[0];

  return (
    <Card eyebrow="Big screen" title="Live display control">
      <div className="grid grid-cols-2 gap-2">
        {slides.map((s) => {
          const on = event.live.slide === s.id;
          const idx = SLIDE_ORDER.indexOf(s.id) + 1;
          return (
            <button
              key={s.id}
              onClick={() => dispatch({ type: 'live/slide', eventId: event.id, slide: s.id })}
              aria-pressed={on}
              title={`Alt+Shift+${idx}`}
              className={cn(
                'flex h-14 items-center gap-3 rounded-xl px-3.5 text-left text-[14px] font-semibold leading-tight transition',
                on ? 'bg-navy text-white shadow-lg shadow-navy/25' : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:ring-navy/40',
              )}
            >
              <Icon name={ICONS[s.id]} className={cn('h-5 w-5 shrink-0', on ? 'text-teal' : 'text-slate-400')} />
              <span className="min-w-0 flex-1">{s.id === 'main' ? 'Main fundraising screen' : SLIDE_LABELS[s.id]}</span>
              {on && <span className="h-2 w-2 shrink-0 rounded-full bg-red-400" aria-label="On screen" />}
            </button>
          );
        })}
        <button
          onClick={() => dispatch({ type: 'event/status', eventId: event.id, status: paused ? 'live' : 'paused' })}
          aria-pressed={paused}
          title="Alt+P"
          className={cn('flex h-14 items-center gap-3 rounded-xl px-3.5 text-left text-[14px] font-semibold transition', paused ? 'bg-amber-400 text-amber-950' : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:ring-amber-400')}
        >
          <Icon name={paused ? 'play' : 'pause'} className="h-5 w-5 shrink-0" />
          {paused ? 'Resume pledges' : 'Pause pledges'}
        </button>
      </div>

      <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
        <p className="text-sm font-semibold text-slate-700">Moments</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={!lastGift} onClick={() => lastGift && dispatch({ type: 'donation/recognise', eventId: event.id, id: lastGift.id, at: Date.now() })}>
            <Icon name="sparkle" className="h-4 w-4" /> Thank last pledger{lastGift ? ` (${money(lastGift.amount)})` : ''}
          </Button>
          <Button size="sm" onClick={() => dispatch({ type: 'live/clearOverlays', eventId: event.id })}>
            <Icon name="x" className="h-4 w-4" /> Clear overlays
          </Button>
        </div>
        {milestones.length > 0 && (
          <div className="flex gap-2">
            <label htmlFor="ms-pick" className="sr-only">
              Milestone to celebrate
            </label>
            <select id="ms-pick" value={chosenMilestone?.id ?? ''} onChange={(e) => setMilestoneId(e.target.value)} className="h-9 min-w-0 flex-1 rounded-lg bg-white px-2 text-sm ring-1 ring-inset ring-slate-300">
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {money(m.amount)} {event.live.celebratedMilestoneIds.includes(m.id) ? '· reached' : ''}
                </option>
              ))}
            </select>
            <Button size="sm" variant="gold" disabled={!chosenMilestone} onClick={() => chosenMilestone && dispatch({ type: 'live/milestone', eventId: event.id, milestoneId: chosenMilestone.id, at: Date.now() })}>
              <Icon name="flag" className="h-4 w-4" /> Celebrate
            </Button>
          </div>
        )}
        <p className="text-[13px] text-slate-500">Milestones celebrate automatically when the total passes them.</p>
        <div className="pt-1">
          <p className="mb-1.5 text-sm font-semibold text-slate-700">Pledge celebrations</p>
          <Segmented<CelebrationLevel>
            label="Pledge celebrations"
            value={event.display.celebration}
            onChange={(celebration) => dispatch({ type: 'event/update', eventId: event.id, patch: { display: { ...event.display, celebration } } })}
            options={[{ value: 'subtle', label: 'Subtle' }, { value: 'standard', label: 'Standard' }, { value: 'festive', label: 'Festive' }]}
          />
        </div>
      </div>
    </Card>
  );
}
