import { useState, type FormEvent } from 'react';
import type { FundraisingEvent, Recognition } from '../../types';
import type { DonorSession } from '../../types';
import { useStore } from '../../state/StoreContext';
import { hashQuery } from '../../utils/router';
import { cn } from '../../utils/cn';

/**
 * "Sign in" for guests: a first name, how they'd like to be shown, one way to
 * reach them about their pledge, and the event code from the big screen.
 * Contact details go only to the event team — never onto a screen.
 */
export function JoinForm({ event, onJoined }: { event: FundraisingEvent; onJoined: (s: DonorSession) => void }) {
  const store = useStore();
  const [name, setName] = useState('');
  const [recognition, setRecognition] = useState<Recognition>('name');
  const [contact, setContact] = useState('');
  const [code, setCode] = useState(() => hashQuery().get('code') ?? '');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const codeFromQr = hashQuery().get('code') === event.pledging.code;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const isEmail = contact.includes('@');
    const result = await store.joinAsDonor({ code, name, recognition, mobile: isEmail ? '' : contact, email: isEmail ? contact : '', consent });
    setBusy(false);
    if (result.ok) onJoined(result.session);
    else setError(result.error);
  };

  const shownAs = recognition === 'anonymous' ? 'Anonymous' : recognition === 'family' ? `${name.trim() || 'Your name'} & Family` : name.trim() || 'Your name';

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-xl shadow-navy/10 ring-1 ring-slate-200/70" aria-labelledby="join-heading">
      <h2 id="join-heading" className="font-display text-[28px] font-[520] leading-tight text-navy">
        Join tonight’s pledge appeal
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-600">Pledge from your seat and watch it arrive on the big screen.</p>

      <label htmlFor="g-name" className="mt-6 block text-sm font-semibold text-slate-700">
        First name
      </label>
      <input
        id="g-name"
        autoComplete="given-name"
        value={name}
        maxLength={40}
        onChange={(e) => setName(e.target.value)}
        className="mt-1.5 h-14 w-full rounded-2xl bg-slate-50 px-4 text-lg ring-1 ring-inset ring-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand"
        placeholder="e.g. Ahmed"
      />

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-slate-700">Show me on screen as</legend>
        <div role="radiogroup" className="mt-1.5 grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1">
          {(['name', 'family', 'anonymous'] as const).map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={recognition === r}
              onClick={() => setRecognition(r)}
              className={cn('h-11 rounded-xl text-[14px] font-semibold transition', recognition === r ? 'bg-white text-navy shadow-sm' : 'text-slate-500')}
            >
              {r === 'name' ? 'Name' : r === 'family' ? '& Family' : 'Anonymous'}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[13px] text-slate-500">
          On screen: <strong className="text-slate-800">{shownAs}</strong>
        </p>
      </fieldset>

      <label htmlFor="g-contact" className="mt-5 block text-sm font-semibold text-slate-700">
        Mobile or email
      </label>
      <input
        id="g-contact"
        autoComplete="email"
        inputMode="email"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        className="mt-1.5 h-14 w-full rounded-2xl bg-slate-50 px-4 text-lg ring-1 ring-inset ring-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand"
        placeholder="0400 000 000 or you@email.com"
        aria-describedby="g-contact-help"
      />
      <p id="g-contact-help" className="mt-1.5 text-[13px] leading-snug text-slate-500">
        Only so our team can help you complete your pledge. Never shown on screen.
      </p>

      {!codeFromQr && (
        <>
          <label htmlFor="g-code" className="mt-5 block text-sm font-semibold text-slate-700">
            Event code <span className="font-normal text-slate-400">(on the big screen)</span>
          </label>
          <input
            id="g-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            maxLength={6}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="tabular mt-1.5 h-14 w-full rounded-2xl bg-slate-50 px-4 text-center text-2xl font-bold tracking-[0.4em] ring-1 ring-inset ring-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="• • • •"
          />
        </>
      )}

      <label className="mt-5 flex cursor-pointer items-start gap-3 text-[14px] leading-snug text-slate-600">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-brand)]" />
        <span>
          {event.organisation} may contact me about completing my pledge. My details won’t be shown publicly.
        </span>
      </label>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="eyebrow mt-6 flex h-16 w-full items-center justify-center rounded-2xl bg-brand text-[15px] text-white shadow-xl shadow-brand/30 transition hover:brightness-105 disabled:opacity-60">
        {busy ? 'Joining…' : 'Join & pledge'}
      </button>
    </form>
  );
}
