import { useState, type FormEvent, type ReactNode } from 'react';
import { useActiveEvent, useDispatch } from '../../state/StoreContext';
import { getActiveLevel, getTotals, nextMilestone } from '../../state/selectors';
import { formatNumber, money, parseAmount, percent } from '../../utils/format';
import { Button, Input } from '../ui/primitives';
import { cn } from '../../utils/cn';

export function KpiStrip() {
  const event = useActiveEvent();
  const totals = getTotals(event);
  const level = getActiveLevel(event);
  const next = nextMilestone(event);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-[1.5fr_1fr_0.8fr_1.3fr_1fr]">
      <Kpi label="Total pledged" dark className="col-span-2 xl:col-span-1">
        <p className="tabular text-[40px] font-semibold leading-none tracking-tight">{money(totals.raised)}</p>
        <p className="mt-2 text-sm text-white/65">{next ? `${money(next.amount - totals.raised)} to next milestone (${money(next.amount)})` : 'All milestones reached'}</p>
      </Kpi>
      <TargetKpi target={event.target} eventId={event.id} />
      <Kpi label="Pledges">
        <p className="tabular text-[32px] font-semibold leading-none">{formatNumber(totals.donorCount)}</p>
        <p className="mt-2 text-sm text-slate-500">
          {event.donations.length} tonight{event.pledging.enabled ? ` · ${event.joinedCount} guests joined` : ''}
        </p>
      </Kpi>
      <Kpi label="Progress">
        <p className="tabular text-[32px] font-semibold leading-none">{percent(totals.progress)}</p>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          <div className="h-full rounded-full bg-gradient-to-r from-brand to-teal transition-[width] duration-700" style={{ width: `${Math.min(100, totals.progress * 100)}%` }} />
        </div>
        <p className="mt-2 text-sm text-slate-500">{totals.remaining > 0 ? `${money(totals.remaining)} to go` : 'Target reached — Alhamdulillah'}</p>
      </Kpi>
      <Kpi label="Current level" accent={!!level}>
        <p className="tabular text-[32px] font-semibold leading-none">{level ? money(level.amount) : '—'}</p>
        <p className={cn('mt-2 text-sm', level ? 'text-white/75' : 'text-slate-500')}>{level ? 'Appeal on screen' : 'No appeal active'}</p>
      </Kpi>
    </div>
  );
}

function Kpi({ label, children, className, dark, accent }: { label: string; children: ReactNode; className?: string; dark?: boolean; accent?: boolean }) {
  return (
    <div className={cn('rounded-2xl p-5 ring-1', dark ? 'bg-navy text-white ring-navy' : accent ? 'bg-brand text-white ring-brand' : 'bg-white ring-slate-200/80', className)}>
      <p className="eyebrow mb-3 text-[11px] opacity-70">{label}</p>
      {children}
    </div>
  );
}

function TargetKpi({ target, eventId }: { target: number; eventId: string }) {
  const dispatch = useDispatch();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const parsed = parseAmount(value);

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!parsed) return;
    dispatch({ type: 'event/update', eventId, patch: { target: parsed } });
    setEditing(false);
  };

  return (
    <Kpi label="Target">
      {editing ? (
        <form onSubmit={save} className="flex gap-2">
          <Input autoFocus aria-label="New target" value={value} onChange={(e) => setValue(e.target.value)} placeholder="300000" inputMode="decimal" className="h-10 tabular" onKeyDown={(e) => e.key === 'Escape' && setEditing(false)} />
          <Button type="submit" variant="primary" size="sm" className="h-10" disabled={!parsed}>
            Save
          </Button>
        </form>
      ) : (
        <p className="tabular text-[32px] font-semibold leading-none">{money(target)}</p>
      )}
      {!editing && (
        <button
          className="mt-2 text-sm font-semibold text-brand hover:underline"
          onClick={() => {
            setValue(String(target));
            setEditing(true);
          }}
        >
          Edit target
        </button>
      )}
    </Kpi>
  );
}
