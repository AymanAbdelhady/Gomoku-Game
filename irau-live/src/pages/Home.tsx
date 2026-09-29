import { useEffect } from 'react';
import { useActiveEvent, useDispatch, useStore } from '../state/StoreContext';
import { getTotals } from '../state/selectors';
import { BrandLogo } from '../components/brand/BrandLogo';
import { GeometricPattern } from '../components/brand/GeometricPattern';
import { Icon, type IconName } from '../components/ui/Icon';
import { money, percent } from '../utils/format';
import { navigate, routeHref } from '../utils/router';
import { openLiveDisplay } from '../components/admin/AdminShell';

/** Launcher for the event team: pick a surface, or start the demo in one click. */
export function Home() {
  const event = useActiveEvent();
  const store = useStore();
  const dispatch = useDispatch();
  const totals = getTotals(event);

  useEffect(() => {
    document.title = `${event.name} · ${event.organisation}`;
  }, [event.name, event.organisation]);

  const startDemo = () => {
    if (!store.runsDemoLocally) {
      // Venue server: demo controls live behind operator access.
      navigate('/admin');
      return;
    }
    if (!event.demo.running) {
      dispatch({ type: 'demo/start', eventId: event.id, at: Date.now(), seed: Math.floor(Math.random() * 2 ** 31), autoStage: event.demo.autoStage, intervalMs: event.demo.intervalMs });
    }
    navigate('/live');
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-ink text-white">
      <div className="stage-bg absolute inset-0" aria-hidden="true" />
      <div className="absolute inset-0 [mask-image:radial-gradient(900px_700px_at_80%_20%,black,transparent)]" aria-hidden="true">
        <GeometricPattern opacity={0.08} />
      </div>
      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-5 py-8 sm:px-8 sm:py-12">
        <BrandLogo event={event} height={36} />
        <div className="mt-16 max-w-3xl sm:mt-24">
          <p className="eyebrow text-xs text-teal sm:text-sm">Live fundraising · {event.city || event.region}</p>
          <h1 className="mt-4 font-display text-5xl font-[520] leading-[1.02] tracking-tight sm:text-7xl">{event.name}</h1>
          <p className="mt-5 text-lg leading-relaxed text-white/70 sm:text-xl">{event.tagline}</p>
          <p className="tabular mt-6 text-white/60">
            <span className="text-2xl font-semibold text-white">{money(totals.raised)}</span> pledged of {money(totals.target)} · {percent(totals.progress, 0)}
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <Tile icon="monitor" title="Live event display" text="The 16:9 stage screen for projectors and LED walls." onClick={openLiveDisplay} href={routeHref('/live')} cta="Open display" />
          <Tile icon="gauge" title="Operator dashboard" text="Enter pledges, run appeals and control the big screen." href={routeHref('/admin')} cta="Open dashboard" />
          <Tile icon="phone" title="Guest pledging" text="Guests scan the QR code, join, and pledge from their seat." href={routeHref('/give')} cta="Open guest page" />
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-3xl bg-gold/10 p-6 ring-1 ring-gold/30 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-gold">Demo mode</p>
            <p className="mt-1 text-sm text-white/70">Simulated pledges every few seconds, appeals and milestones — for rehearsals and presentations. No real payments are involved.</p>
          </div>
          <button onClick={startDemo} className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-gold px-7 font-bold text-[#1d1403] transition hover:brightness-105">
            <Icon name="play" /> {event.demo.running ? 'Watch the demo' : 'Start demo'}
          </button>
        </div>

        <p className="mt-auto pt-12 text-xs leading-relaxed text-white/40">
          Tip: open the display on the projector and the dashboard on your laptop or tablet. {store.runsDemoLocally ? 'In this mode both must be in the same browser; run the venue sync server for separate devices.' : 'Connected to the venue sync server — any device on this network can join.'}
        </p>
      </div>
    </main>
  );
}

function Tile({ icon, title, text, href, cta, onClick }: { icon: IconName; title: string; text: string; href: string; cta: string; onClick?: () => void }) {
  return (
    <a
      href={href}
      onClick={
        onClick
          ? (e) => {
              e.preventDefault();
              onClick();
            }
          : undefined
      }
      className="group flex flex-col rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 transition hover:bg-white/[0.1] hover:ring-white/25"
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/25 text-teal">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <span className="mt-5 text-lg font-semibold">{title}</span>
      <span className="mt-1.5 text-sm leading-relaxed text-white/60">{text}</span>
      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-teal">
        {cta} <span className="transition group-hover:translate-x-0.5">→</span>
      </span>
    </a>
  );
}
