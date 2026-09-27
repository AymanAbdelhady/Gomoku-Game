import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { CelebrationLevel, FundraisingEvent, GivingFrequency, RegionCode } from '../types';
import type { Action } from '../state/actions';
import { AdminShell } from '../components/admin/AdminShell';
import { ColourSetting, MoneySetting, TextSetting } from '../components/admin/settingsFields';
import { Badge, Button, Card, Dialog, Segmented, Toggle } from '../components/ui/primitives';
import { Icon } from '../components/ui/Icon';
import { QrCode } from '../components/ui/QrCode';
import { useActiveEvent, useAppState, useDispatch } from '../state/StoreContext';
import { getTotals, qrTarget } from '../state/selectors';
import { normaliseState } from '../state/store/persistence';
import { REGIONS, regionLabel } from '../config/locations';
import { BRAND, PLACEHOLDER, SLIDE_LABELS, SLIDE_ORDER } from '../config/campaign';
import { createEvent, pledgeCode } from '../config/defaults';
import { useStore } from '../state/StoreContext';
import { useGuestLink } from '../state/useGuestLink';
import type { DonorAccount } from '../types';
import { isPlaceholder, publicDonorName } from '../utils/content';
import { money } from '../utils/format';
import { uid } from '../utils/id';
import { cn } from '../utils/cn';

type EventPatch = Extract<Action, { type: 'event/update' }>['patch'];

const SECTIONS = [
  ['event', 'Event details'],
  ['locations', 'Cities & events'],
  ['fundraising', 'Target & totals'],
  ['pledging', 'Phone pledging'],
  ['pledgers', 'Pledgers (private)'],
  ['donate', 'Donation link & QR'],
  ['levels', 'Giving levels'],
  ['milestones', 'Milestones'],
  ['impact', 'Impact statements'],
  ['slides', 'Live slides'],
  ['display', 'Display options'],
  ['brand', 'Brand colours'],
  ['data', 'Pledges & data'],
] as const;

export function Settings() {
  const event = useActiveEvent();
  const dispatch = useDispatch();
  const update = (patch: EventPatch) => dispatch({ type: 'event/update', eventId: event.id, patch });

  useEffect(() => {
    document.title = `Settings · ${event.name}`;
  }, [event.name]);

  const placeholders = [...event.givingLevels.map((l) => l.impact), ...event.impactMessages.map((m) => m.text)].filter((t) => isPlaceholder(t)).length;

  return (
    <AdminShell page="settings">
      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="lg:sticky lg:top-24 lg:self-start">
          <h1 className="mb-4 font-display text-3xl font-[520] text-navy">Settings</h1>
          <p className="mb-4 text-sm text-slate-500">
            Editing <strong className="text-slate-700">{event.region} · {event.city || 'City TBC'}</strong>. Changes apply to the live screen immediately.
          </p>
          <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
            {SECTIONS.map(([id, label]) => (
              <li key={id}>
                <a href={`#/admin/settings`} onClick={(e) => { e.preventDefault(); document.getElementById(`s-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-navy">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-6">
          {placeholders > 0 && (
            <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
              <Icon name="flag" className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                <strong>{placeholders} impact statements are still “{PLACEHOLDER}”.</strong> They are never shown to the audience. Replace them only with figures confirmed by Islamic Relief Australia.
              </p>
            </div>
          )}

          <Section id="event" title="Event details" description="What the audience reads on every screen.">
            <div className="grid gap-5 md:grid-cols-2">
              <TextSetting label="Campaign / event name" value={event.name} onCommit={(name) => update({ name })} />
              <TextSetting label="Organisation" value={event.organisation} onCommit={(organisation) => update({ organisation })} />
              <div>
                <label htmlFor="region" className="mb-1.5 block text-sm font-semibold text-slate-700">State / territory</label>
                <select id="region" value={event.region} onChange={(e) => update({ region: e.target.value as RegionCode })} className="h-12 w-full rounded-xl bg-white px-3 ring-1 ring-inset ring-slate-300 focus:outline-none focus:ring-2 focus:ring-brand">
                  {REGIONS.map((r) => (
                    <option key={r.code} value={r.code}>{r.code} — {r.label}</option>
                  ))}
                </select>
              </div>
              <TextSetting label="City" value={event.city} onCommit={(city) => update({ city })} />
              <TextSetting label="Venue" value={event.venue} placeholder="e.g. venue name (shown in the display header)" onCommit={(venue) => update({ venue })} />
              <TextSetting label="Event date" type="date" value={event.date} onCommit={(date) => update({ date })} />
              <TextSetting className="md:col-span-2" label="Supporting line" value={event.tagline} onCommit={(tagline) => update({ tagline })} />
              <TextSetting className="md:col-span-2" multiline label="Event description" value={event.description} onCommit={(description) => update({ description })} hint="Internal summary of the campaign focus." />
              <TextSetting className="md:col-span-2" multiline label="Campaign statement" value={event.campaignStatement} onCommit={(campaignStatement) => update({ campaignStatement })} hint="Shown on the impact slide and guest page." />
              <TextSetting className="md:col-span-2" label="Partner line" value={event.partnerLine} onCommit={(partnerLine) => update({ partnerLine })} />
            </div>
          </Section>

          <LocationsSection />

          <Section id="fundraising" title="Target & totals">
            <div className="grid gap-5 md:grid-cols-3">
              <MoneySetting label="Target" value={event.target} onCommit={(target) => update({ target })} />
              <MoneySetting
                label="Current total"
                allowZero
                value={getTotals(event).raised}
                onCommit={(raised) => dispatch({ type: 'event/setRaised', eventId: event.id, raised })}
                hint="Corrects the total (e.g. to include pre-event pledges or online gifts). Doesn’t trigger celebrations."
              />
              <NumberSetting label="Pledges before tonight" value={event.openingDonorCount} onCommit={(openingDonorCount) => update({ openingDonorCount })} hint="Added to the pledge count." />
            </div>
          </Section>

          <PledgingSection event={event} />
          <PledgersSection event={event} />

          <Section id="donate" title="Donation link & QR code" description="Where guests complete their pledges (the “Complete my pledge” and “Donate” buttons).">
            <div className="grid gap-6 md:grid-cols-[1fr_auto]">
              <div className="space-y-5">
                <TextSetting
                  label="Donation URL"
                  type="url"
                  value={event.donationUrl}
                  onCommit={(donationUrl) => update({ donationUrl: donationUrl.trim() })}
                  hint={<>The official donation page. Optional tokens <code>{'{amount}'}</code> and <code>{'{frequency}'}</code> are filled in from the guest page if your platform supports pre-filled amounts.</>}
                />
                <TextSetting label="QR code URL (optional)" type="url" value={event.qrUrl} placeholder="Leave blank to use the donation URL" onCommit={(qrUrl) => update({ qrUrl: qrUrl.trim() })} hint="e.g. a campaign link with tracking, or this app’s /#/give page when hosted publicly." />
                <TextSetting label="Label under the QR code" value={event.qrLabel} onCommit={(qrLabel) => update({ qrLabel })} />
                {!/^https:\/\//i.test(qrTarget(event)) && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">The QR link should start with https:// so phones open it securely.</p>}
              </div>
              <div className="text-center">
                <div className="inline-block rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                  {qrTarget(event) ? <QrCode value={qrTarget(event)} size={176} /> : <div className="grid h-44 w-44 place-items-center text-sm text-slate-400">No URL</div>}
                </div>
                <a href={qrTarget(event)} target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-center gap-1 text-sm font-semibold text-brand hover:underline">
                  Test link <Icon name="external" className="h-4 w-4" />
                </a>
              </div>
            </div>
          </Section>

          <LevelsSection event={event} />
          <MilestonesSection event={event} />
          <ImpactSection event={event} />
          <SlidesSection event={event} />

          <Section id="display" title="Display options">
            <div className="grid gap-6 md:grid-cols-2">
              <Toggle checked={event.display.showAmounts} onChange={(v) => update({ display: { ...event.display, showAmounts: v } })} label="Show pledge amounts" description="In the recent pledges feed and pledge wall." />
              <Toggle checked={event.display.showImpactOnGift} onChange={(v) => update({ display: { ...event.display, showImpactOnGift: v } })} label="Show impact line with new pledges" description="Only confirmed statements are shown." />
              <Toggle checked={event.display.cornerQr} onChange={(v) => update({ display: { ...event.display, cornerQr: v } })} label="QR code on the main screen" />
              <div className="md:col-span-2">
                <p className="mb-1.5 text-[15px] font-semibold text-slate-800">Pledge celebrations</p>
                <p className="mb-2 text-[13px] text-slate-500">Light that travels from each new pledge into the bar, bursts of stars, and golden fireworks for major pledges. Bigger pledges get bigger moments.</p>
                <Segmented<CelebrationLevel>
                  label="Pledge celebrations"
                  value={event.display.celebration}
                  onChange={(celebration) => update({ display: { ...event.display, celebration } })}
                  options={[{ value: 'subtle', label: 'Subtle' }, { value: 'standard', label: 'Standard' }, { value: 'festive', label: 'Festive' }]}
                />
              </div>
              <Toggle checked={event.display.calmMotion} onChange={(v) => update({ display: { ...event.display, calmMotion: v } })} label="Calm motion" description="Minimal animation on the live display (also follows the device’s reduced-motion setting)." />
              <MoneySetting label="Automatic thank-you from" allowZero value={event.display.recognitionThreshold} onCommit={(recognitionThreshold) => update({ display: { ...event.display, recognitionThreshold } })} hint="Pledges at or above this pre-tick “Thank-you on screen”. 0 turns it off." />
              <MoneySetting label="Gold treatment from" allowZero value={event.display.goldThreshold} onCommit={(goldThreshold) => update({ display: { ...event.display, goldThreshold } })} hint="Gold is reserved for major pledges. 0 turns it off." />
            </div>
          </Section>

          <Section id="brand" title="Brand colours" actions={<Button size="sm" onClick={() => update({ brand: { ...BRAND } })}>Reset to Islamic Relief</Button>}>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <ColourSetting label="Primary (Islamic Relief blue)" value={event.brand.primary} onCommit={(primary) => update({ brand: { ...event.brand, primary } })} />
              <ColourSetting label="Navy" value={event.brand.navy} onCommit={(navy) => update({ brand: { ...event.brand, navy } })} />
              <ColourSetting label="Teal" value={event.brand.teal} onCommit={(teal) => update({ brand: { ...event.brand, teal } })} />
              <ColourSetting label="Gold (major pledges)" value={event.brand.gold} onCommit={(gold) => update({ brand: { ...event.brand, gold } })} />
            </div>
          </Section>

          <DataSection event={event} />
        </div>
      </div>
    </AdminShell>
  );
}

function Section({ id, title, description, actions, children }: { id: string; title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div id={`s-${id}`} className="scroll-mt-28">
      <Card title={title} actions={actions}>
        {description && <p className="-mt-2 mb-5 text-sm text-slate-500">{description}</p>}
        {children}
      </Card>
    </div>
  );
}

function NumberSetting({ label, value, onCommit, hint }: { label: string; value: number; onCommit: (v: number) => void; hint?: string }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        <input
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
          onBlur={() => onCommit(Number(draft) || 0)}
          className="tabular mt-1.5 h-12 w-full rounded-xl bg-white px-4 font-normal ring-1 ring-inset ring-slate-300 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>
      {hint && <p className="mt-1.5 text-[13px] text-slate-500">{hint}</p>}
    </div>
  );
}

function RowActions({ enabled, onToggle, onDelete, label }: { enabled?: boolean; onToggle?: (v: boolean) => void; onDelete: () => void; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-7">
      {onToggle && (
        <button role="switch" aria-checked={enabled} aria-label={`Show ${label}`} onClick={() => onToggle(!enabled)} className={cn('relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors', enabled ? 'bg-brand' : 'bg-slate-300')}>
          <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', enabled ? 'translate-x-6' : 'translate-x-1')} />
        </button>
      )}
      <button onClick={onDelete} aria-label={`Delete ${label}`} className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600">
        <Icon name="trash" className="h-5 w-5" />
      </button>
    </div>
  );
}

function LevelsSection({ event }: { event: FundraisingEvent }) {
  const dispatch = useDispatch();
  const levels = event.givingLevels.slice().sort((a, b) => b.amount - a.amount);
  const set = (givingLevels: FundraisingEvent['givingLevels']) => dispatch({ type: 'event/update', eventId: event.id, patch: { givingLevels } });
  return (
    <Section id="levels" title="Giving levels" description="Stage appeal amounts and the operator’s quick-add buttons (first eight). Impact lines are optional." actions={<Button size="sm" onClick={() => set([...event.givingLevels, { id: uid('lvl'), amount: 0, impact: PLACEHOLDER, enabled: false }])}><Icon name="plus" className="h-4 w-4" /> Add level</Button>}>
      <div className="space-y-3">
        {levels.map((l) => (
          <div key={l.id} className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[180px_1fr_auto]">
            <MoneySetting label="Amount" value={l.amount} allowZero onCommit={(amount) => set(event.givingLevels.map((x) => (x.id === l.id ? { ...x, amount } : x)))} hint=" " />
            <TextSetting label="Impact line" value={l.impact} flagPlaceholder onCommit={(impact) => set(event.givingLevels.map((x) => (x.id === l.id ? { ...x, impact } : x)))} />
            <RowActions label={money(l.amount)} enabled={l.enabled} onToggle={(enabled) => set(event.givingLevels.map((x) => (x.id === l.id ? { ...x, enabled } : x)))} onDelete={() => set(event.givingLevels.filter((x) => x.id !== l.id))} />
          </div>
        ))}
      </div>
    </Section>
  );
}

function MilestonesSection({ event }: { event: FundraisingEvent }) {
  const dispatch = useDispatch();
  const list = event.milestones.slice().sort((a, b) => a.amount - b.amount);
  const set = (milestones: FundraisingEvent['milestones']) => dispatch({ type: 'event/update', eventId: event.id, patch: { milestones } });
  return (
    <Section
      id="milestones"
      title="Milestones"
      description="A full-screen celebration plays once when the total first passes each milestone."
      actions={<Button size="sm" onClick={() => set([...event.milestones, { id: uid('ms'), amount: 0, enabled: false, headline: 'Alhamdulillah', message: 'Thank you for standing with Gaza.' }])}><Icon name="plus" className="h-4 w-4" /> Add milestone</Button>}
    >
      <div className="space-y-3">
        {list.map((m) => (
          <div key={m.id} className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[160px_180px_1fr_auto]">
            <MoneySetting label="Amount" value={m.amount} allowZero onCommit={(amount) => set(event.milestones.map((x) => (x.id === m.id ? { ...x, amount } : x)))} hint={event.live.celebratedMilestoneIds.includes(m.id) ? 'Reached ✓' : ' '} />
            <TextSetting label="Headline" value={m.headline} onCommit={(headline) => set(event.milestones.map((x) => (x.id === m.id ? { ...x, headline } : x)))} />
            <TextSetting label="Message" value={m.message} onCommit={(message) => set(event.milestones.map((x) => (x.id === m.id ? { ...x, message } : x)))} />
            <RowActions label={`milestone ${money(m.amount)}`} enabled={m.enabled} onToggle={(enabled) => set(event.milestones.map((x) => (x.id === m.id ? { ...x, enabled } : x)))} onDelete={() => set(event.milestones.filter((x) => x.id !== m.id))} />
          </div>
        ))}
      </div>
      <Button size="sm" variant="ghost" className="mt-3" onClick={() => dispatch({ type: 'live/clearOverlays', eventId: event.id })}>
        Clear queued celebrations
      </Button>
    </Section>
  );
}

function ImpactSection({ event }: { event: FundraisingEvent }) {
  const dispatch = useDispatch();
  const set = (impactMessages: FundraisingEvent['impactMessages']) => dispatch({ type: 'event/update', eventId: event.id, patch: { impactMessages } });
  const sorted = event.impactMessages.slice().sort((a, b) => (a.frequency === b.frequency ? (a.amount ?? 0) - (b.amount ?? 0) : a.frequency === 'one-off' ? -1 : 1));
  return (
    <Section
      id="impact"
      title="Impact statements"
      description="Used on the impact slide, the guest page and alongside matching pledges. Only use statements confirmed by Islamic Relief Australia."
      actions={<Button size="sm" onClick={() => set([...event.impactMessages, { id: uid('imp'), frequency: 'one-off', amount: undefined, text: PLACEHOLDER }])}><Icon name="plus" className="h-4 w-4" /> Add statement</Button>}
    >
      <div className="space-y-3">
        {sorted.map((m) => (
          <div key={m.id} className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[180px_160px_1fr_auto]">
            <div>
              <p className="mb-1.5 text-sm font-semibold text-slate-700">Type</p>
              <Segmented<GivingFrequency> label="Frequency" value={m.frequency} onChange={(frequency) => set(event.impactMessages.map((x) => (x.id === m.id ? { ...x, frequency } : x)))} options={[{ value: 'one-off', label: 'One-off' }, { value: 'monthly', label: 'Monthly' }]} />
            </div>
            <MoneySetting label="Amount" allowZero value={m.amount ?? 0} onCommit={(amount) => set(event.impactMessages.map((x) => (x.id === m.id ? { ...x, amount: amount || undefined } : x)))} hint=" " />
            <TextSetting label="Statement" value={m.text} flagPlaceholder onCommit={(text) => set(event.impactMessages.map((x) => (x.id === m.id ? { ...x, text } : x)))} />
            <RowActions label="statement" onDelete={() => set(event.impactMessages.filter((x) => x.id !== m.id))} />
          </div>
        ))}
      </div>
    </Section>
  );
}

function SlidesSection({ event }: { event: FundraisingEvent }) {
  const dispatch = useDispatch();
  const update = (patch: EventPatch) => dispatch({ type: 'event/update', eventId: event.id, patch });
  const setSlide = (id: string, patch: Partial<FundraisingEvent['slides'][number]>) => update({ slides: event.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  return (
    <Section id="slides" title="Live slides" description="Hide slides you won’t use tonight, and edit their wording.">
      <div className="space-y-3">
        {SLIDE_ORDER.map((id, i) => {
          const s = event.slides.find((x) => x.id === id)!;
          return (
            <div key={id} className="rounded-2xl bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-slate-800">
                  <span className="mr-2 text-slate-400">{i + 1}.</span>
                  {SLIDE_LABELS[id]}
                  {event.live.slide === id && <Badge tone="red" className="ml-2">On screen</Badge>}
                </p>
                <Toggle checked={s.enabled} onChange={(enabled) => setSlide(id, { enabled })} label={<span className="sr-only">Show {SLIDE_LABELS[id]} in slide controls</span>} disabled={id === 'main'} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <TextSetting label="Title" value={s.title} onCommit={(title) => setSlide(id, { title })} />
                <TextSetting label="Subtitle" value={s.subtitle} onCommit={(subtitle) => setSlide(id, { subtitle })} />
              </div>
            </div>
          );
        })}
        <div className="rounded-2xl bg-slate-50 p-4">
          <TextSetting label="Appeal prompt" value={event.display.appealPrompt} onCommit={(appealPrompt) => update({ display: { ...event.display, appealPrompt } })} hint={<>Shown when a giving level is activated. <code>{'{amount}'}</code> is replaced with the level, e.g. “Who will help us reach $10,000?”</>} />
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="mb-3 text-sm text-slate-600">
            <strong>Optional quotation or verse</strong> for the thank-you slide. The app never generates religious text — it only shows exactly what an administrator enters here.
          </p>
          <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
            <TextSetting multiline label="Quotation / verse" value={event.display.adminQuote} onCommit={(adminQuote) => update({ display: { ...event.display, adminQuote } })} />
            <TextSetting label="Source / reference" value={event.display.adminQuoteSource} onCommit={(adminQuoteSource) => update({ display: { ...event.display, adminQuoteSource } })} />
          </div>
        </div>
      </div>
    </Section>
  );
}

function LocationsSection() {
  const state = useAppState();
  const dispatch = useDispatch();
  const active = useActiveEvent();
  const [region, setRegion] = useState<RegionCode>('VIC');
  const [confirmDelete, setConfirmDelete] = useState<FundraisingEvent | null>(null);
  const events = Object.values(state.events).sort((a, b) => REGIONS.findIndex((r) => r.code === a.region) - REGIONS.findIndex((r) => r.code === b.region));

  const addEvent = (copyCurrent: boolean) => {
    const base = createEvent(region);
    const event = copyCurrent
      ? {
          ...base,
          name: active.name,
          organisation: active.organisation,
          tagline: active.tagline,
          description: active.description,
          campaignStatement: active.campaignStatement,
          partnerLine: active.partnerLine,
          target: active.target,
          donationUrl: active.donationUrl,
          qrUrl: active.qrUrl,
          qrLabel: active.qrLabel,
          givingLevels: active.givingLevels.map((l) => ({ ...l, id: uid('lvl') })),
          milestones: active.milestones.map((m) => ({ ...m, id: uid('ms') })),
          impactMessages: active.impactMessages.map((m) => ({ ...m, id: uid('imp') })),
          slides: active.slides.map((s) => ({ ...s })),
          brand: { ...active.brand },
          display: { ...active.display },
        }
      : base;
    dispatch({ type: 'event/create', event, activate: true });
  };

  return (
    <Section id="locations" title="Cities & events" description="Each city has its own venue, date, target, donation link, content and pledges. The live display always shows the active event.">
      <ul className="divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-200">
        {events.map((e) => {
          const t = getTotals(e);
          const isActive = e.id === state.activeEventId;
          return (
            <li key={e.id} className={cn('flex flex-wrap items-center gap-3 px-4 py-3', isActive && 'bg-brand/5')}>
              <span className="grid h-10 w-12 place-items-center rounded-lg bg-navy text-xs font-bold text-white">{e.region}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">
                  {e.city || regionLabel(e.region)} {e.venue && <span className="font-normal text-slate-500">· {e.venue}</span>}
                </p>
                <p className="tabular text-[13px] text-slate-500">
                  {e.date || 'Date TBC'} · {money(t.raised)} of {money(t.target)} · {e.donations.length} gifts
                </p>
              </div>
              {isActive ? (
                <Badge tone="blue">Active</Badge>
              ) : (
                <Button size="sm" onClick={() => dispatch({ type: 'event/activate', eventId: e.id })}>
                  Make active
                </Button>
              )}
              <button disabled={events.length <= 1} onClick={() => setConfirmDelete(e)} aria-label={`Delete ${e.region} ${e.city} event`} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30">
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="new-region" className="mb-1.5 block text-sm font-semibold text-slate-700">New event in</label>
          <select id="new-region" value={region} onChange={(e) => setRegion(e.target.value as RegionCode)} className="h-11 rounded-xl bg-white px-3 ring-1 ring-inset ring-slate-300">
            {REGIONS.map((r) => (
              <option key={r.code} value={r.code}>{r.code} — {r.defaultCity}</option>
            ))}
          </select>
        </div>
        <Button onClick={() => addEvent(true)} variant="primary">
          <Icon name="plus" className="h-4 w-4" /> Copy current settings
        </Button>
        <Button onClick={() => addEvent(false)}>From campaign template</Button>
      </div>
      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete this event?"
        footer={
          <>
            <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="primary" className="bg-red-600 shadow-none hover:bg-red-700" onClick={() => { if (confirmDelete) dispatch({ type: 'event/delete', eventId: confirmDelete.id }); setConfirmDelete(null); }}>
              Delete event
            </Button>
          </>
        }
      >
        <p className="text-slate-600">This removes {confirmDelete?.city || confirmDelete?.region}’s configuration and its {confirmDelete?.donations.length ?? 0} recorded gifts from this system. Export the data first if you need it.</p>
      </Dialog>
    </Section>
  );
}

function DataSection({ event }: { event: FundraisingEvent }) {
  const dispatch = useDispatch();
  const state = useAppState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState('');

  const download = (name: string, content: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const rows = [['Time', 'Amount (AUD)', 'Name entered', 'Shown publicly as', 'Anonymous', 'Name hidden', 'Source']];
    for (const d of event.donations) {
      rows.push([new Date(d.timestamp).toISOString(), String(d.amount), d.donor.name, publicDonorName(d), String(d.anonymous), String(d.nameHidden), d.source]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    download(`gifts-${event.region}-${event.date || 'event'}.csv`, csv, 'text/csv');
  };

  const importJson = async (file: File) => {
    try {
      const next = normaliseState(JSON.parse(await file.text()));
      dispatch({ type: 'state/replace', state: { ...next, rev: state.rev + 1 } });
      setMessage(`Imported ${Object.keys(next.events).length} events.`);
    } catch {
      setMessage('That file could not be read as a configuration export.');
    }
  };

  return (
    <Section id="data" title="Pledges & data" description="Pledges are moderated from the dashboard’s pledge feed (hide names, change recognition, remove entries).">
      <div className="flex flex-wrap gap-2">
        <Button onClick={exportCsv} disabled={event.donations.length === 0}>
          <Icon name="download" className="h-4 w-4" /> Export pledges (CSV)
        </Button>
        <Button onClick={() => download(`irau-live-config-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(state, null, 2), 'application/json')}>
          <Icon name="download" className="h-4 w-4" /> Export all settings (JSON)
        </Button>
        <Button onClick={() => fileRef.current?.click()}>
          <Icon name="upload" className="h-4 w-4" /> Import settings
        </Button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        <Button variant="danger" onClick={() => setConfirmReset(true)}>
          <Icon name="trash" className="h-4 w-4" /> Reset tonight’s pledges
        </Button>
      </div>
      {message && <p role="status" className="mt-3 text-sm text-slate-600">{message}</p>}
      <p className="mt-4 text-[13px] leading-relaxed text-slate-500">
        Pledges here are promises; each pledge stores a display name, amount and time. Pledger contact details are kept separately and only operators can see them. Reconcile totals against your payment platform / CRM, which remains the record of truth.
      </p>
      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={`Reset ${event.city || event.region}?`}
        footer={
          <>
            <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button variant="primary" className="bg-red-600 shadow-none hover:bg-red-700" onClick={() => { dispatch({ type: 'event/resetData', eventId: event.id }); setConfirmReset(false); }}>
              Reset to $0
            </Button>
          </>
        }
      >
        <p className="text-slate-600">All {event.donations.length} gifts, the opening balance and celebrated milestones will be cleared for this event. Settings and content are kept.</p>
      </Dialog>
    </Section>
  );
}

function PledgingSection({ event }: { event: FundraisingEvent }) {
  const dispatch = useDispatch();
  const store = useStore();
  const link = useGuestLink(event);
  const p = event.pledging;
  const set = (patch: Partial<FundraisingEvent['pledging']>) => dispatch({ type: 'event/update', eventId: event.id, patch: { pledging: { ...p, ...patch } } });
  const detected = store.publicBaseUrl();
  const localOnly = /^(https?:\/\/)?(localhost|127\.)/.test(link.url);

  return (
    <Section id="pledging" title="Phone pledging" description="Guests scan the QR code, join with their first name and a mobile or email, and pledge from their seat. Their pledges arrive on the big screen.">
      <div className="grid gap-6 md:grid-cols-[1fr_auto]">
        <div className="space-y-5">
          <Toggle checked={p.enabled} onChange={(enabled) => set({ enabled })} label="Allow pledges from phones" description="When off, the QR code goes straight to the donation page instead." />
          <div>
            <p className="mb-1.5 text-sm font-semibold text-slate-700">Event code</p>
            <div className="flex items-center gap-3">
              <span className="tabular rounded-xl bg-slate-100 px-4 py-2.5 text-2xl font-bold tracking-[0.2em] text-navy">{p.code}</span>
              <Button size="sm" onClick={() => set({ code: pledgeCode() })}>New code</Button>
            </div>
            <p className="mt-1.5 text-[13px] text-slate-500">Shown on screen and built into the QR code, so only people in the room can join. A new code doesn’t sign out guests who already joined.</p>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-slate-700">Phone pledges appear on screen</p>
            <Segmented<'auto' | 'manual'>
              label="Approval"
              value={p.approval}
              onChange={(approval) => set({ approval })}
              options={[{ value: 'auto', label: 'Instantly' }, { value: 'manual', label: 'After I approve' }]}
            />
            <p className="mt-1.5 text-[13px] text-slate-500">“After I approve” adds an approvals panel to the dashboard. Names are cleaned (letters only) either way, and you can hide any name from the pledge feed.</p>
          </div>
          <MoneySetting label="Largest pledge from a phone" value={p.maxAmount} onCommit={(maxAmount) => set({ maxAmount })} hint="Larger pledges are directed to speak with the team." />
          <TextSetting
            label="Address phones use (optional)"
            type="url"
            value={p.publicUrl}
            placeholder={detected ?? 'https://pledge.your-domain.org/'}
            onCommit={(publicUrl) => set({ publicUrl: publicUrl.trim() })}
            hint={detected ? `Detected on the venue network: ${detected}. Leave blank to use it.` : 'Where this app is reachable from guests’ phones. Leave blank to use this browser’s address.'}
          />
          {localOnly && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">The QR code currently points to “localhost”, which phones can’t open. Run the venue sync server and open the display using the computer’s network address, or set the address above.</p>}
        </div>
        <div className="text-center">
          <div className="inline-block rounded-2xl bg-white p-3 ring-1 ring-slate-200">
            <QrCode value={link.url} size={176} />
          </div>
          <a href={link.url} target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-center gap-1 text-sm font-semibold text-brand hover:underline">
            Open guest page <Icon name="external" className="h-4 w-4" />
          </a>
        </div>
      </div>
    </Section>
  );
}

function PledgersSection({ event }: { event: FundraisingEvent }) {
  const store = useStore();
  const [list, setList] = useState<DonorAccount[] | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      setList((await store.listDonors()).filter((d) => d.eventId === event.id));
    } catch {
      setError('Could not load pledgers — unlock the dashboard with the operator passcode.');
    }
  };

  const pledgesBy = (id: string) => event.donations.filter((d) => d.donorId === id);

  const exportCsv = () => {
    if (!list) return;
    const rows = [['Joined', 'Name', 'Shown as', 'Mobile', 'Email', 'Pledges', 'Total pledged (AUD)', 'Consent to contact']];
    for (const d of list) {
      const ps = pledgesBy(d.id);
      rows.push([new Date(d.createdAt).toISOString(), d.name, d.recognition, d.mobile, d.email, String(ps.length), String(ps.reduce((s, p) => s + p.amount, 0)), String(d.consent)]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `pledgers-${event.region}-${event.date || 'event'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Section
      id="pledgers"
      title="Pledgers (private)"
      description="Guests who joined from their phones, with the contact details they gave for pledge follow-up. Only operators can see this; it is never sent to screens or phones."
      actions={
        <>
          <Button size="sm" onClick={load}>{list ? 'Refresh' : 'Load pledgers'}</Button>
          <Button size="sm" onClick={exportCsv} disabled={!list?.length}>
            <Icon name="download" className="h-4 w-4" /> CSV
          </Button>
        </>
      }
    >
      {error && <p className="text-sm text-red-700">{error}</p>}
      {!list && !error && <p className="text-sm text-slate-500">{event.joinedCount} guests have joined this event. Load the list to see contact details.</p>}
      {list && list.length === 0 && <p className="text-sm text-slate-500">No guests have joined from their phones yet.</p>}
      {list && list.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[12px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-semibold">Name</th>
                <th className="py-2 pr-4 font-semibold">Mobile / email</th>
                <th className="py-2 pr-4 text-right font-semibold">Pledged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((d) => {
                const ps = pledgesBy(d.id);
                return (
                  <tr key={d.id}>
                    <td className="py-2.5 pr-4 font-medium text-slate-900">{d.name || 'Anonymous'}{d.recognition === 'anonymous' && d.name ? ' (anonymous on screen)' : ''}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{[d.mobile, d.email].filter(Boolean).join(' · ')}</td>
                    <td className="tabular py-2.5 pr-4 text-right font-semibold text-navy">{ps.length ? `${money(ps.reduce((s, p) => s + p.amount, 0))} (${ps.length})` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
