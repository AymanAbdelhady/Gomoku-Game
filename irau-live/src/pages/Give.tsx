import { useEffect } from 'react';
import { useActiveEvent, useSyncStatus } from '../state/StoreContext';
import { getTotals } from '../state/selectors';
import { money, percent } from '../utils/format';
import { useAnimatedNumber, usePrefersReducedMotion } from '../utils/hooks';
import { GeometricPattern } from '../components/brand/GeometricPattern';
import { BrandLogo } from '../components/brand/BrandLogo';
import { useGuestSession } from '../components/donor/session';
import { JoinForm } from '../components/donor/JoinForm';
import { PledgePanel } from '../components/donor/PledgePanel';

/**
 * Public, mobile-first guest page — the QR code destination.
 * Guests join with a first name and a way to reach them, then pledge from
 * their seat; pledges appear on the big screen. No payment is taken here:
 * "Complete my pledge" hands over to the official donation page.
 * When phone pledging is paused, guests see that it will open shortly.
 */
export function Give() {
  return <GuestPledging />;
}

function GuestPledging() {
  const event = useActiveEvent();
  const reduced = usePrefersReducedMotion();
  const totals = getTotals(event);
  const raised = useAnimatedNumber(totals.raised, reduced);
  const status = useSyncStatus();
  const { session, signIn, signOut, mine, remember } = useGuestSession(event.id);
  const showProgress = status.mode === 'server' || totals.raised > 0;

  useEffect(() => {
    document.title = `Pledge · ${event.name}`;
  }, [event.name]);

  return (
    <div className="min-h-dvh bg-mist text-slate-ink">
      <GuestHeader event={event} />
      <main className="relative mx-auto -mt-16 max-w-md space-y-5 px-4 pb-16">
        {showProgress && <ProgressCard raised={raised} target={totals.target} progress={totals.progress} count={totals.donorCount} />}
        {!event.pledging.enabled ? (
          <section className="rounded-3xl bg-white p-7 text-center shadow-xl shadow-navy/10 ring-1 ring-slate-200/70">
            <p className="font-display text-[26px] font-[520] text-navy">Pledging opens soon</p>
            <p className="mt-2 text-[15px] text-slate-600">Keep this page open — you’ll be able to pledge from your seat shortly.</p>
          </section>
        ) : session ? (
          <PledgePanel event={event} session={session} mine={mine} remember={remember} signOut={signOut} />
        ) : (
          <JoinForm event={event} onJoined={signIn} />
        )}
        <footer className="pt-6 text-center text-[13px] text-slate-500">
          <p className="font-semibold text-slate-700">Jazakum Allahu Khairan</p>
          <p className="mt-1">{event.organisation}</p>
        </footer>
      </main>
    </div>
  );
}

function GuestHeader({ event }: { event: ReturnType<typeof useActiveEvent> }) {
  return (
    <header className="relative overflow-hidden bg-ink px-5 pb-24 pt-6 text-white">
      <div className="stage-bg absolute inset-0" aria-hidden="true" />
      <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true">
        <GeometricPattern opacity={0.08} tile={88} />
      </div>
      <div className="relative mx-auto max-w-md">
        <BrandLogo event={event} height={30} />
        <h1 className="mt-10 font-display text-[44px] font-[520] leading-[1.02] tracking-tight">{event.name}</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-white/70">{event.tagline}</p>
      </div>
    </header>
  );
}

function ProgressCard({ raised, target, progress, count }: { raised: number; target: number; progress: number; count: number }) {
  return (
    <section aria-label="Pledges so far" className="rounded-3xl bg-white p-6 shadow-xl shadow-navy/10 ring-1 ring-slate-200/70">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-[11px] text-slate-500">Pledged tonight</p>
          <p className="tabular mt-1 text-[38px] font-semibold leading-none tracking-tight text-navy">{money(raised)}</p>
        </div>
        <div className="text-right">
          <p className="eyebrow text-[11px] text-slate-500">Target</p>
          <p className="tabular mt-1 text-xl font-semibold text-slate-700">{money(target)}</p>
        </div>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.round(raised)} aria-label="Progress towards target">
        <div className="h-full rounded-full bg-gradient-to-r from-brand to-teal transition-[width] duration-1000" style={{ width: `${Math.max(2, Math.min(100, progress * 100))}%` }} />
      </div>
      <p className="tabular mt-2.5 text-sm text-slate-500">
        {percent(progress, 0)} of target · {count.toLocaleString('en-AU')} {count === 1 ? 'pledge' : 'pledges'}
      </p>
    </section>
  );
}
