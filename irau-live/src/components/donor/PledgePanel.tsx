import { useEffect, useState } from 'react';
import type { DonorSession, FundraisingEvent } from '../../types';
import type { MyPledge } from './session';
import { useStore } from '../../state/StoreContext';
import { enabledLevels, getActiveLevel, giftsAtLevel } from '../../state/selectors';
import { buildDonationUrl, publicText } from '../../utils/content';
import { money, parseAmount } from '../../utils/format';
import { cn } from '../../utils/cn';
import { PhoneCelebration } from './PhoneCelebration';
import { HeartIcon } from '../stage/GiftCelebration';

interface Props {
  event: FundraisingEvent;
  session: DonorSession;
  mine: MyPledge[];
  remember: (p: MyPledge) => void;
  signOut: () => void;
}

type Stage = { kind: 'pick' } | { kind: 'confirm'; amount: number; levelId?: string } | { kind: 'sending' } | { kind: 'done'; pledge: MyPledge };

/** Signed-in guest: tap the live appeal or choose an amount, confirm, celebrate. */
export function PledgePanel({ event, session, mine, remember, signOut }: Props) {
  const store = useStore();
  const [stage, setStage] = useState<Stage>({ kind: 'pick' });
  const [selected, setSelected] = useState<number | null>(null);
  const [other, setOther] = useState('');
  const [error, setError] = useState('');
  const level = getActiveLevel(event);
  const levels = enabledLevels(event).slice().reverse();
  const otherAmount = parseAmount(other);
  const amount = other ? otherAmount : selected;
  const shownAs = session.recognition === 'anonymous' || !session.name ? 'Anonymous' : session.recognition === 'family' ? `${session.name} & Family` : session.name;
  const approvedIds = new Set(event.donations.filter((d) => d.donorId === session.donorId).map((d) => d.id));
  const myTotal = mine.filter((p) => p.status === 'approved' || approvedIds.has(p.id)).reduce((s, p) => s + p.amount, 0);
  const paused = event.status !== 'live' || !event.pledging.enabled;

  useEffect(() => setError(''), [amount]);

  const send = async (value: number, levelId?: string) => {
    setStage({ kind: 'sending' });
    const result = await store.submitPledge(session, value, levelId);
    if (!result.ok) {
      setError(result.error);
      setStage({ kind: 'pick' });
      return;
    }
    const p: MyPledge = { id: result.pledge.id, amount: result.pledge.amount, status: result.status, at: Date.now() };
    remember(p);
    setSelected(null);
    setOther('');
    setStage({ kind: 'done', pledge: p });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigator.vibrate?.([30, 40, 60]);
  };

  if (stage.kind === 'done') {
    const onScreen = stage.pledge.status === 'approved';
    const gold = event.display.goldThreshold > 0 && stage.pledge.amount >= event.display.goldThreshold;
    return (
      <section className="anim-rise rounded-3xl bg-white p-7 text-center shadow-xl shadow-navy/10 ring-1 ring-slate-200/70" aria-live="assertive">
        <PhoneCelebration trigger={stage.pledge.id} gold={gold} />
        <span className={cn('mx-auto grid h-20 w-20 place-items-center rounded-full', gold ? 'bg-gold text-[#1d1403]' : 'bg-brand text-white')}>
          <HeartIcon className="h-10 w-10" />
        </span>
        <p className="mt-5 font-display text-[30px] font-[520] leading-tight text-navy">Jazakum Allahu Khairan</p>
        <p className={cn('tabular mt-3 text-[48px] font-bold leading-none', gold ? 'text-[#9a7428]' : 'text-navy')}>{money(stage.pledge.amount)}</p>
        <p className="mt-2 text-[15px] text-slate-500">pledged as {shownAs}</p>
        <p className="mt-5 rounded-2xl bg-teal/10 px-4 py-3 text-[16px] font-medium text-navy">
          {onScreen ? 'Look up — your pledge is on the big screen now!' : 'Received! It will appear on the big screen in a moment.'}
        </p>
        <a
          href={buildDonationUrl(event.donationUrl, stage.pledge.amount, 'one-off')}
          target="_blank"
          rel="noopener"
          className="eyebrow mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-navy text-[14px] text-white"
        >
          Complete my pledge now
        </a>
        <p className="mt-2 text-[13px] text-slate-500">Or our team will be in touch to help you complete it.</p>
        <button onClick={() => setStage({ kind: 'pick' })} className="mt-5 text-[15px] font-semibold text-brand">
          Pledge again
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-3xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200/70">
        <div>
          <p className="text-[13px] text-slate-500">Assalamu alaikum</p>
          <p className="text-[17px] font-semibold text-navy">{shownAs}</p>
        </div>
        <div className="text-right">
          {myTotal > 0 && <p className="tabular text-[15px] font-semibold text-navy">{money(myTotal)} pledged</p>}
          <button onClick={signOut} className="text-[13px] font-medium text-slate-500 underline-offset-2 hover:underline">
            Not you?
          </button>
        </div>
      </div>

      {paused && <p className="rounded-2xl bg-amber-50 px-4 py-3 text-[15px] text-amber-900">Pledges are paused for a moment. Please stay with us.</p>}

      {level && !paused && (
        <section className="anim-rise relative overflow-hidden rounded-3xl bg-ink p-6 text-white shadow-xl shadow-navy/20" aria-label="Appeal on stage now">
          <div className="stage-bg absolute inset-0" aria-hidden="true" />
          <div className="relative">
            <p className="eyebrow flex items-center gap-2 text-[11px] text-teal">
              <span className="anim-live-dot h-2 w-2 rounded-full bg-teal" /> On stage now
            </p>
            <p className="mt-3 font-display text-[24px] leading-tight">{event.display.appealPrompt.replace('{amount}', '').replace(/\s*\?$/, '').trim() || 'Who will pledge'}</p>
            <p className="tabular mt-1 text-[54px] font-bold leading-none text-gold">{money(level.amount)}</p>
            {publicText(level.impact) && <p className="mt-2 text-[15px] italic text-white/75">{level.impact}</p>}
            <p className="mt-3 text-[13px] text-white/60">{giftsAtLevel(event, level.id).length} pledged so far</p>
            <button
              onClick={() => setStage({ kind: 'confirm', amount: level.amount, levelId: level.id })}
              className="eyebrow mt-5 flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-gold text-[15px] text-[#1d1403] shadow-lg transition active:scale-[0.98]"
            >
              <HeartIcon className="h-5 w-5" /> I’ll pledge {money(level.amount)}
            </button>
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-xl shadow-navy/10 ring-1 ring-slate-200/70" aria-labelledby="pick-heading">
        <h2 id="pick-heading" className="font-display text-[24px] font-[520] text-navy">
          {level ? 'Or choose your pledge' : 'Choose your pledge'}
        </h2>
        <div role="radiogroup" aria-label="Pledge amount" className="mt-4 grid grid-cols-2 gap-2.5">
          {levels.map((l) => {
            const on = !other && selected === l.amount;
            return (
              <button
                key={l.id}
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setSelected(l.amount);
                  setOther('');
                }}
                className={cn('flex min-h-[76px] flex-col justify-center rounded-2xl px-4 py-3 text-left transition active:scale-[0.98]', on ? 'bg-navy text-white shadow-lg shadow-navy/25' : 'bg-slate-50 ring-1 ring-inset ring-slate-200')}
              >
                <span className={cn('tabular text-[22px] font-bold', on ? 'text-white' : 'text-navy')}>{money(l.amount)}</span>
                {publicText(l.impact) && <span className={cn('mt-0.5 text-[12px] leading-snug', on ? 'text-white/75' : 'text-slate-500')}>{l.impact}</span>}
              </button>
            );
          })}
        </div>
        <label htmlFor="g-other" className="eyebrow mt-5 block text-[11px] text-slate-500">
          Other amount
        </label>
        <div className="relative mt-2">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-slate-400">$</span>
          <input
            id="g-other"
            inputMode="decimal"
            value={other}
            onChange={(e) => setOther(e.target.value)}
            placeholder="Enter an amount"
            className={cn('tabular h-14 w-full rounded-2xl bg-slate-50 pl-9 pr-4 text-xl font-semibold ring-1 ring-inset focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand', other && !otherAmount ? 'ring-red-400' : 'ring-slate-200')}
          />
        </div>
        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {error}
          </p>
        )}
        <button
          disabled={!amount || paused || stage.kind === 'sending'}
          onClick={() => amount && setStage({ kind: 'confirm', amount })}
          className="eyebrow mt-5 flex h-16 w-full items-center justify-center rounded-2xl bg-brand text-[15px] text-white shadow-xl shadow-brand/30 transition active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none"
        >
          {stage.kind === 'sending' ? 'Sending…' : amount ? `Pledge ${money(amount)}` : 'Choose an amount'}
        </button>
      </section>

      {mine.length > 0 && (
        <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200/70" aria-labelledby="mine-heading">
          <h2 id="mine-heading" className="text-[15px] font-semibold text-slate-800">
            My pledges tonight
          </h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {mine.map((p) => {
              const shown = p.status === 'approved' || approvedIds.has(p.id);
              return (
                <li key={p.id} className="flex items-center justify-between py-2.5">
                  <span className="tabular text-[17px] font-semibold text-navy">{money(p.amount)}</span>
                  <span className={cn('text-[13px] font-medium', shown ? 'text-emerald-700' : 'text-amber-700')}>{shown ? 'On screen ✓' : 'Awaiting confirmation'}</span>
                </li>
              );
            })}
          </ul>
          <a href={buildDonationUrl(event.donationUrl, myTotal || undefined, 'one-off')} target="_blank" rel="noopener" className="mt-4 block text-center text-[15px] font-semibold text-brand">
            Complete my pledges online →
          </a>
        </section>
      )}

      {stage.kind === 'confirm' && (
        <ConfirmSheet
          amount={stage.amount}
          shownAs={shownAs}
          onCancel={() => setStage({ kind: 'pick' })}
          onConfirm={() => void send(stage.amount, stage.levelId)}
        />
      )}
    </div>
  );
}

function ConfirmSheet({ amount, shownAs, onCancel, onConfirm }: { amount: number; shownAs: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={onCancel}>
      <div className="anim-rise w-full max-w-md rounded-t-[32px] bg-white p-7 pb-10 text-center" onClick={(e) => e.stopPropagation()}>
        <p id="confirm-title" className="text-[15px] font-medium text-slate-500">
          Confirm your pledge
        </p>
        <p className="tabular mt-2 text-[56px] font-bold leading-none text-navy">{money(amount)}</p>
        <p className="mt-3 text-[15px] text-slate-600">
          Shown on screen as <strong className="text-slate-900">{shownAs}</strong>
        </p>
        <p className="mt-4 text-[13px] leading-snug text-slate-500">A pledge is a promise to give. You can complete it online tonight, or our team will contact you.</p>
        <button autoFocus onClick={onConfirm} className="eyebrow mt-6 flex h-16 w-full items-center justify-center rounded-2xl bg-brand text-[15px] text-white shadow-xl shadow-brand/30 active:scale-[0.98]">
          Confirm pledge
        </button>
        <button onClick={onCancel} className="mt-3 h-12 w-full rounded-2xl text-[15px] font-semibold text-slate-600">
          Cancel
        </button>
      </div>
    </div>
  );
}
