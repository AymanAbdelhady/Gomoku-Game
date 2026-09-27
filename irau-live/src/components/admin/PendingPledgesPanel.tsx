import { useActiveEvent, useDispatch } from '../../state/StoreContext';
import { publicDonorName } from '../../utils/content';
import { money } from '../../utils/format';
import { timeAgo } from '../../utils/time';
import { useNow } from '../../utils/hooks';
import { Button, Card } from '../ui/primitives';
import { Icon } from '../ui/Icon';

/** Phone pledges waiting for an operator to put them on screen (approval: manual). */
export function PendingPledgesPanel() {
  const event = useActiveEvent();
  const dispatch = useDispatch();
  const now = useNow(5000);
  const pending = event.pendingPledges;
  if (event.pledging.approval !== 'manual' && pending.length === 0) return null;

  const approve = (id: string) => dispatch({ type: 'pledge/approve', eventId: event.id, id, at: Date.now() });

  return (
    <Card
      eyebrow="From phones"
      title={pending.length ? `${pending.length} pledge${pending.length === 1 ? '' : 's'} awaiting approval` : 'Pledge approvals'}
      className={pending.length ? 'ring-2 ring-brand' : undefined}
      actions={
        pending.length > 1 ? (
          <Button size="sm" variant="primary" onClick={() => pending.forEach((p, i) => window.setTimeout(() => approve(p.id), i * 150))}>
            Approve all
          </Button>
        ) : null
      }
      bodyClassName="px-0 pb-2"
    >
      {pending.length === 0 ? (
        <p className="px-6 pb-4 text-sm text-slate-500">Phone pledges will wait here for you to approve before they appear on screen.</p>
      ) : (
        <ul className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto">
          {pending.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-6 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-slate-900">{publicDonorName(p)}</p>
                <p className="text-[13px] text-slate-500">{timeAgo(p.timestamp, now)}</p>
              </div>
              <span className="tabular text-[17px] font-bold text-navy">{money(p.amount)}</span>
              <Button size="sm" variant="primary" onClick={() => approve(p.id)} aria-label={`Approve ${money(p.amount)} from ${publicDonorName(p)}`}>
                <Icon name="check" className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="danger" onClick={() => dispatch({ type: 'pledge/decline', eventId: event.id, id: p.id })} aria-label={`Decline ${money(p.amount)} from ${publicDonorName(p)}`}>
                <Icon name="x" className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
