import { useActiveEvent, useDispatch, useStore } from '../../state/StoreContext';
import { Button, Card, Segmented, Toggle } from '../ui/primitives';
import { Icon } from '../ui/Icon';

const PACES = [
  { value: '5000', label: 'Calm' },
  { value: '3200', label: 'Standard' },
  { value: '1600', label: 'Lively' },
];

/** DEMO MODE — simulated gifts for rehearsals and presentations. Clearly labelled everywhere. */
export function DemoPanel() {
  const event = useActiveEvent();
  const dispatch = useDispatch();
  const store = useStore();
  const { running, autoStage, intervalMs } = event.demo;
  const demoCount = event.donations.filter((d) => d.source === 'demo').length;

  const start = () =>
    dispatch({ type: 'demo/start', eventId: event.id, at: Date.now(), seed: Math.floor(Math.random() * 2 ** 31), autoStage, intervalMs });

  return (
    <Card
      eyebrow="Rehearsal"
      title="Demo mode"
      className={running ? 'ring-2 ring-gold' : undefined}
      actions={running ? <span className="rounded-full bg-gold/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#7a5d1f]">Running</span> : null}
    >
      <p className="text-sm leading-relaxed text-slate-600">
        Simulated pledges arrive every few seconds so you can present the platform without a payment system. Demo pledges are labelled and can be cleared in one click.
        {!store.runsDemoLocally && ' The venue sync server runs the demo clock.'}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant={running ? 'secondary' : 'gold'} size="lg" className="whitespace-nowrap px-3" disabled={running} onClick={start}>
          <Icon name="play" /> Start demo
        </Button>
        <Button variant="dark" size="lg" className="whitespace-nowrap px-3" disabled={!running} onClick={() => dispatch({ type: 'demo/stop', eventId: event.id })}>
          <Icon name="stop" /> Stop demo
        </Button>
      </div>
      <div className="mt-5 space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-semibold text-slate-700">Pace</p>
          <Segmented label="Demo pace" value={String(intervalMs)} onChange={(v) => dispatch({ type: 'demo/configure', eventId: event.id, intervalMs: Number(v) })} options={PACES} />
        </div>
        <Toggle
          checked={autoStage}
          onChange={(v) => dispatch({ type: 'demo/configure', eventId: event.id, autoStage: v })}
          label="Also run the stage"
          description="Plays appeals, impact, QR and pledge-wall slides automatically."
        />
        <Button size="sm" variant="danger" disabled={demoCount === 0} onClick={() => dispatch({ type: 'demo/clear', eventId: event.id })}>
          <Icon name="trash" className="h-4 w-4" /> Clear {demoCount || ''} demo pledges
        </Button>
      </div>
    </Card>
  );
}
