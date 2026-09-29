import { useState } from 'react';
import type { Donation, Recognition } from '../../types';
import { useActiveEvent, useDispatch } from '../../state/StoreContext';
import { recentDonations } from '../../state/selectors';
import { money } from '../../utils/format';
import { publicDonorName } from '../../utils/content';
import { clockTime, timeAgo } from '../../utils/time';
import { useNow } from '../../utils/hooks';
import { Badge, Button, Card, Dialog } from '../ui/primitives';
import { Icon } from '../ui/Icon';
import { cn } from '../../utils/cn';

/** Real-time list of gifts with moderation: hide name, change recognition, thank on screen, remove. */
export function DonationFeedPanel() {
  const event = useActiveEvent();
  const dispatch = useDispatch();
  const now = useNow(5000);
  const [hideDemo, setHideDemo] = useState(false);
  const [confirm, setConfirm] = useState<Donation | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const all = recentDonations(event, 200);
  const list = hideDemo ? all.filter((d) => d.source !== 'demo') : all;

  const setRecognition = (d: Donation, recognition: Recognition) =>
    dispatch({ type: 'donation/update', eventId: event.id, id: d.id, patch: { donor: { ...d.donor, recognition } } });

  return (
    <Card
      eyebrow={`${event.donations.length} pledges`}
      title="Pledge feed"
      bodyClassName="px-0 pb-2"
      actions={
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-500">
          <input type="checkbox" className="h-4 w-4 accent-[var(--color-brand)]" checked={hideDemo} onChange={(e) => setHideDemo(e.target.checked)} />
          Hide demo
        </label>
      }
    >
      {list.length === 0 ? (
        <p className="px-6 py-10 text-center text-slate-500">No pledges yet. Add the first one, or start Demo Mode.</p>
      ) : (
        <ol className="max-h-[640px] divide-y divide-slate-100 overflow-y-auto" aria-label="Pledges, newest first">
          {list.map((d) => {
            const shown = publicDonorName(d);
            const expanded = open === d.id;
            return (
              <li key={d.id} className={cn('px-6 py-3 transition', now - d.timestamp < 6000 && 'bg-brand/[0.04]')}>
                <div className="flex items-center gap-3">
                  <button
                    className="min-w-0 flex-1 rounded-lg text-left"
                    onClick={() => setOpen(expanded ? null : d.id)}
                    aria-expanded={expanded}
                    aria-controls={`don-${d.id}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn('truncate text-[15px] font-semibold', d.nameHidden ? 'text-slate-400 line-through' : 'text-slate-900')}>{d.donor.name || 'Anonymous'}</span>
                      {d.source === 'demo' && <Badge tone="gold">Demo</Badge>}
                      {d.source === 'online' && <Badge tone="blue">Online</Badge>}
                      {(d.source === 'app' || d.viaPhone) && <Badge tone="blue">Phone</Badge>}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-slate-500">
                      <time dateTime={new Date(d.timestamp).toISOString()} title={clockTime(d.timestamp)}>
                        {timeAgo(d.timestamp, now)}
                      </time>
                      {shown !== (d.donor.name || 'Anonymous') && <> · shown as “{shown}”</>}
                    </span>
                  </button>
                  <span className="tabular text-[17px] font-bold text-navy">{money(d.amount)}</span>
                </div>
                {expanded && (
                  <div id={`don-${d.id}`} className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => dispatch({ type: 'donation/recognise', eventId: event.id, id: d.id, at: Date.now() })}>
                      <Icon name="sparkle" className="h-4 w-4" /> Thank on screen
                    </Button>
                    <Button size="sm" onClick={() => dispatch({ type: 'donation/update', eventId: event.id, id: d.id, patch: { nameHidden: !d.nameHidden } })}>
                      <Icon name={d.nameHidden ? 'eye' : 'eyeOff'} className="h-4 w-4" /> {d.nameHidden ? 'Show name' : 'Hide name'}
                    </Button>
                    {d.donor.name && (
                      <select
                        aria-label="Recognition"
                        value={d.donor.recognition}
                        onChange={(e) => setRecognition(d, e.target.value as Recognition)}
                        className="h-9 rounded-lg bg-white px-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300"
                      >
                        <option value="name">{d.donor.name}</option>
                        <option value="family">{d.donor.name} & Family</option>
                        <option value="anonymous">Anonymous</option>
                      </select>
                    )}
                    <Button size="sm" variant="danger" onClick={() => setConfirm(d)}>
                      <Icon name="trash" className="h-4 w-4" /> Remove
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Remove this pledge?"
        footer={
          <>
            <Button onClick={() => setConfirm(null)}>Keep it</Button>
            <Button
              variant="primary"
              className="bg-red-600 shadow-none hover:bg-red-700"
              onClick={() => {
                if (confirm) dispatch({ type: 'donation/remove', eventId: event.id, id: confirm.id });
                setConfirm(null);
              }}
            >
              Remove {confirm ? money(confirm.amount) : ''}
            </Button>
          </>
        }
      >
        <p className="text-slate-600">The total, pledge count and live screen will update immediately. Use this for entry mistakes; to keep a pledge but protect privacy, use “Hide name” instead.</p>
      </Dialog>
    </Card>
  );
}
