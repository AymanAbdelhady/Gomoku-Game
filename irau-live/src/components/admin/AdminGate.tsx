import { useState, type FormEvent, type ReactNode } from 'react';
import { useActiveEvent, useStore, useSyncStatus } from '../../state/StoreContext';
import { BrandLogo } from '../brand/BrandLogo';
import { GeometricPattern } from '../brand/GeometricPattern';
import { Button, Input } from '../ui/primitives';
import { Icon } from '../ui/Icon';
import { routeHref } from '../../utils/router';

const SESSION_KEY = 'irau-live:operator-session';

/**
 * PLACEHOLDER AUTHENTICATION — for demonstration only.
 * In server mode the passcode is checked by the sync server and required for
 * every write; in local mode it only hides the operator screens. Replace with
 * real SSO/auth before production (see README → Security).
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const store = useStore();
  const status = useSyncStatus();
  const event = useActiveEvent();
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1' && (status.mode === 'local' || status.authorised);
    } catch {
      return false;
    }
  });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (unlocked) return <>{children}</>;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await store.authorise(code);
    setBusy(false);
    if (ok) {
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        /* private mode */
      }
      setUnlocked(true);
    } else {
      setError('That passcode was not recognised.');
    }
  };

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-ink px-4 py-10 text-white">
      <div className="stage-bg absolute inset-0" aria-hidden="true" />
      <div className="absolute inset-0 opacity-70" aria-hidden="true">
        <GeometricPattern opacity={0.06} />
      </div>
      <form onSubmit={submit} className="relative w-full max-w-md rounded-[28px] bg-white p-8 text-slate-ink shadow-2xl sm:p-10">
        <BrandLogo event={event} height={40} tone="dark" />
        <h1 className="mt-8 font-display text-3xl font-[520]">Operator access</h1>
        <p className="mt-2 text-slate-600">
          {event.name}
          {event.city ? ` · ${event.city}` : ''}
        </p>
        <label htmlFor="passcode" className="mt-8 block text-sm font-semibold text-slate-700">
          Passcode
        </label>
        <Input
          id="passcode"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError('');
          }}
          className="mt-1.5 h-14 text-lg"
          aria-invalid={!!error}
          aria-describedby="passcode-help"
        />
        {error && (
          <p role="alert" className="mt-2 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" className="mt-6 w-full" disabled={!code || busy}>
          <Icon name="lock" />
          {busy ? 'Checking…' : 'Unlock dashboard'}
        </Button>
        <p id="passcode-help" className="mt-6 rounded-xl bg-amber-50 p-3.5 text-[13px] leading-snug text-amber-900">
          <strong>Prototype access.</strong> The demo passcode is <code className="rounded bg-amber-100 px-1">gaza</code> unless your team has changed it.{' '}
          {status.mode === 'local' ? 'In this same-browser mode it is a screen lock, not real security.' : 'Verified by the event sync server.'}
        </p>
        <a href={routeHref('/')} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy">
          <Icon name="arrowLeft" className="h-4 w-4" /> Back to launcher
        </a>
      </form>
    </main>
  );
}

export function lockAdmin() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  window.location.hash = '/';
}
