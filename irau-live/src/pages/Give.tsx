import { useEffect, useMemo, useState } from 'react';
import type { GivingFrequency } from '../types';
import { useActiveEvent, useSyncStatus } from '../state/StoreContext';
import { getTotals, impactFor } from '../state/selectors';
import { buildDonationUrl, publicText } from '../utils/content';
import { money, parseAmount, percent } from '../utils/format';
import { useAnimatedNumber, usePrefersReducedMotion } from '../utils/hooks';
import { GeometricPattern } from '../components/brand/GeometricPattern';
import { Wordmark } from '../components/brand/Wordmark';
import { cn } from '../utils/cn';

/**
 * Public, mobile-first donor page (the QR code destination if hosted).
 * It never collects payment or personal data: "Donate now" hands over to the
 * official Islamic Relief Australia donation page.
 */
export function Give() {
  const event = useActiveEvent();
  const reduced = usePrefersReducedMotion();
  const totals = getTotals(event);
  const raised = useAnimatedNumber(totals.raised, reduced);
  const [frequency, setFrequency] = useState<GivingFrequency>('one-off');
  const status = useSyncStatus();
  // Without the sync server a phone has no event data of its own; don't show a misleading $0.
  const showProgress = status.mode === 'server' || totals.raised > 0;

  const options = useMemo(
    () =>
      event.impactMessages
        .filter((m) => m.frequency === frequency && m.amount)
        .sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0))
        .map((m) => ({ amount: m.amount!, text: publicText(m.text) })),
    [event.impactMessages, frequency],
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [other, setOther] = useState('');
  const otherAmount = parseAmount(other);
  const amount = other ? otherAmount : selected;

  useEffect(() => {
    document.title = `Give · ${event.name}`;
  }, [event.name]);
  useEffect(() => {
    setSelected(options[1]?.amount ?? options[0]?.amount ?? null);
    setOther('');
  }, [frequency, options]);

  const href = buildDonationUrl(event.donationUrl, amount ?? undefined, frequency);
  // Preset cards already show their impact line; only echo it for a typed amount that matches one.
  const impact = other && amount ? impactFor(event, amount, frequency) : '';

  return (
    <div className="min-h-dvh bg-mist text-slate-ink">
      <header className="relative overflow-hidden bg-[#081530] px-5 pb-24 pt-6 text-white">
        <div className="stage-bg absolute inset-0" aria-hidden="true" />
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true">
          <GeometricPattern opacity={0.08} tile={88} />
        </div>
        <div className="relative mx-auto max-w-md">
          <Wordmark organisation={event.organisation} size="sm" />
          <h1 className="mt-10 font-display text-[44px] font-[520] leading-[1.02] tracking-tight">{event.name}</h1>
          <p className="mt-3 text-[17px] leading-relaxed text-white/70">{event.tagline}</p>
        </div>
      </header>

      <main className="relative mx-auto -mt-16 max-w-md px-4 pb-16">
        {showProgress && (
        <section aria-label="Fundraising progress" className="rounded-3xl bg-white p-6 shadow-xl shadow-navy/10 ring-1 ring-slate-200/70">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-[11px] text-slate-500">Raised</p>
              <p className="tabular mt-1 text-[38px] font-semibold leading-none tracking-tight text-navy">{money(raised)}</p>
            </div>
            <div className="text-right">
              <p className="eyebrow text-[11px] text-slate-500">Target</p>
              <p className="tabular mt-1 text-xl font-semibold text-slate-700">{money(totals.target)}</p>
            </div>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={totals.target} aria-valuenow={Math.round(totals.raised)} aria-label="Progress towards target">
            <div className="h-full rounded-full bg-gradient-to-r from-brand to-teal transition-[width] duration-1000" style={{ width: `${Math.max(2, Math.min(100, totals.progress * 100))}%` }} />
          </div>
          <p className="tabular mt-2.5 text-sm text-slate-500">
            {percent(totals.progress, 0)} of target · {totals.donorCount.toLocaleString('en-AU')} donors
          </p>
        </section>
        )}

        <section className={cn(showProgress ? 'mt-8' : 'rounded-3xl bg-white p-6 shadow-xl shadow-navy/10 ring-1 ring-slate-200/70')} aria-labelledby="give-heading">
          <h2 id="give-heading" className="font-display text-[28px] font-[520] leading-tight text-navy">
            Help us send specialised medical missions to Gaza.
          </h2>
          {publicText(event.campaignStatement) && <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{event.campaignStatement}</p>}

          <div role="radiogroup" aria-label="Giving frequency" className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-200/60 p-1">
            {(['one-off', 'monthly'] as const).map((f) => (
              <button
                key={f}
                role="radio"
                aria-checked={frequency === f}
                onClick={() => setFrequency(f)}
                className={cn('eyebrow h-12 rounded-xl text-[13px] transition', frequency === f ? 'bg-white text-navy shadow-sm' : 'text-slate-500')}
              >
                {f === 'one-off' ? 'One-off' : 'Monthly'}
              </button>
            ))}
          </div>

          <div role="radiogroup" aria-label="Amount" className="mt-4 space-y-2.5">
            {options.map((o) => {
              const on = !other && selected === o.amount;
              return (
                <button
                  key={`${frequency}-${o.amount}`}
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    setSelected(o.amount);
                    setOther('');
                  }}
                  className={cn('flex w-full items-center gap-4 rounded-2xl p-4 text-left transition', on ? 'bg-navy text-white shadow-lg shadow-navy/25' : 'bg-white ring-1 ring-inset ring-slate-200 hover:ring-brand/50')}
                >
                  <span className={cn('tabular w-[88px] shrink-0 text-2xl font-bold', on ? 'text-white' : 'text-navy')}>{money(o.amount)}</span>
                  <span className={cn('flex-1 text-[15px] leading-snug', on ? 'text-white/85' : 'text-slate-600')}>
                    {o.text}
                    {frequency === 'monthly' && <span className={cn('block text-xs', on ? 'text-white/60' : 'text-slate-400')}>per month</span>}
                  </span>
                  <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full ring-2', on ? 'bg-white ring-white' : 'ring-slate-300')} aria-hidden="true">
                    {on && <span className="h-2.5 w-2.5 rounded-full bg-navy" />}
                  </span>
                </button>
              );
            })}
          </div>

          <label htmlFor="other-amount" className="eyebrow mt-6 block text-[12px] text-slate-500">
            Other amount
          </label>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-slate-400">$</span>
            <input
              id="other-amount"
              inputMode="decimal"
              autoComplete="off"
              value={other}
              onChange={(e) => setOther(e.target.value)}
              placeholder="Enter an amount"
              className={cn('tabular h-14 w-full rounded-2xl bg-white pl-9 pr-4 text-xl font-semibold ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-brand', other && !otherAmount ? 'ring-red-400' : 'ring-slate-200')}
              aria-invalid={!!other && !otherAmount}
            />
          </div>

          {impact && <p className="mt-4 rounded-2xl bg-teal/10 px-4 py-3 text-[15px] text-navy">{impact}</p>}

          <a
            href={href}
            target="_blank"
            rel="noopener"
            aria-disabled={!amount}
            onClick={(e) => !amount && e.preventDefault()}
            className={cn('eyebrow mt-6 flex h-16 w-full items-center justify-center rounded-2xl text-[16px] text-white shadow-xl transition', amount ? 'bg-brand shadow-brand/30 hover:brightness-105' : 'cursor-not-allowed bg-slate-300 shadow-none')}
          >
            Donate now{amount ? ` · ${money(amount)}${frequency === 'monthly' ? '/mo' : ''}` : ''}
          </a>
          <p className="mt-3 text-center text-[13px] leading-relaxed text-slate-500">
            You’ll complete your gift securely on the official {event.organisation} website.
          </p>
        </section>

        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-[13px] text-slate-500">
          <p className="font-semibold text-slate-700">Jazakum Allahu Khairan</p>
          <p className="mt-1">{event.organisation}</p>
        </footer>
      </main>
    </div>
  );
}
