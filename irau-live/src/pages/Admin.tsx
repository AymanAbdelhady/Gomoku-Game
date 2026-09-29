import { useCallback, useEffect, useState } from 'react';
import { AdminShell } from '../components/admin/AdminShell';
import { KpiStrip } from '../components/admin/KpiStrip';
import { QuickAddPanel } from '../components/admin/QuickAddPanel';
import { LevelControl } from '../components/admin/LevelControl';
import { SlideControl } from '../components/admin/SlideControl';
import { DonationFeedPanel } from '../components/admin/DonationFeedPanel';
import { DemoPanel } from '../components/admin/DemoPanel';
import { PendingPledgesPanel } from '../components/admin/PendingPledgesPanel';
import { StagePreview } from '../components/admin/StagePreview';
import { useQuickAdd } from '../components/admin/useQuickAdd';
import { SHORTCUTS, useShortcuts } from '../components/admin/useShortcuts';
import { useActiveEvent } from '../state/StoreContext';
import { Button, Card, Dialog } from '../components/ui/primitives';
import { Icon } from '../components/ui/Icon';

/**
 * Operator command centre. Layout priorities, backstage:
 * 1) enter a gift in one keystroke, 2) see exactly what the audience sees,
 * 3) switch the big screen in one tap.
 */
export function Admin() {
  const event = useActiveEvent();
  const qa = useQuickAdd(event);
  const [help, setHelp] = useState(false);
  const openHelp = useCallback(() => setHelp(true), []);
  useShortcuts(event, qa, openHelp);

  useEffect(() => {
    document.title = `Operator · ${event.name} · ${event.city || event.region}`;
  }, [event.name, event.city, event.region]);

  return (
    <AdminShell page="dashboard">
      <h1 className="sr-only">Fundraising operator dashboard</h1>
      <KpiStrip />

      <div className="mt-5 grid gap-5 lg:grid-cols-2 2xl:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_minmax(0,3fr)]">
        <div className="space-y-5">
          <QuickAddPanel event={event} api={qa} />
          <LevelControl />
        </div>
        <div className="space-y-5">
          <Card eyebrow="Audience view" title="On the big screen" bodyClassName="pt-2">
            <StagePreview />
          </Card>
          <SlideControl />
        </div>
        <div className="space-y-5 lg:col-span-2 2xl:col-span-1">
          <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-1">
            <PendingPledgesPanel />
            <DonationFeedPanel />
            <DemoPanel />
          </div>
          <Button variant="ghost" size="sm" onClick={openHelp} className="text-slate-500">
            <Icon name="keyboard" className="h-4 w-4" /> Keyboard shortcuts (?)
          </Button>
        </div>
      </div>

      <Dialog open={help} onClose={() => setHelp(false)} title="Keyboard shortcuts" footer={<Button onClick={() => setHelp(false)}>Close</Button>}>
        <dl className="divide-y divide-slate-100">
          {SHORTCUTS.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-6 py-2.5">
              <dt>
                <kbd className="rounded-md bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-800 ring-1 ring-slate-200">{k}</kbd>
              </dt>
              <dd className="text-right text-sm text-slate-600">{v}</dd>
            </div>
          ))}
        </dl>
      </Dialog>
    </AdminShell>
  );
}
