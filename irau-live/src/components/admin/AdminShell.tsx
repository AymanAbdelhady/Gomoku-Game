import type { ReactNode } from 'react';
import { useActiveEvent, useAppState, useDispatch, useSyncStatus } from '../../state/StoreContext';
import { BrandLogo } from '../brand/BrandLogo';
import { Icon } from '../ui/Icon';
import { cn } from '../../utils/cn';
import { absoluteRoute, routeHref } from '../../utils/router';
import { lockAdmin } from './AdminGate';
import { REGIONS } from '../../config/locations';

export function openLiveDisplay() {
  window.open(absoluteRoute('/live'), 'irau-live-display', 'popup=yes,width=1280,height=720');
}

/** Sticky operator top bar: event switcher, live status, sync health, navigation. */
export function AdminShell({ children, page }: { children: ReactNode; page: 'dashboard' | 'settings' }) {
  const state = useAppState();
  const event = useActiveEvent();
  const dispatch = useDispatch();
  const status = useSyncStatus();
  const events = Object.values(state.events);
  const paused = event.status === 'paused';

  return (
    <div className="min-h-dvh bg-mist">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 bg-navy text-white shadow-lg shadow-navy/20">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-6">
          <a href={routeHref('/admin')} className="mr-2 rounded-md">
            <BrandLogo event={event} height={28} />
          </a>

          <label className="flex items-center gap-2 rounded-xl bg-white/10 py-1 pl-3 pr-1 text-sm">
            <Icon name="mapPin" className="h-4 w-4 text-teal" />
            <span className="sr-only">Active event</span>
            <select
              value={event.id}
              onChange={(e) => dispatch({ type: 'event/activate', eventId: e.target.value })}
              className="h-9 cursor-pointer rounded-lg bg-transparent pr-2 font-semibold text-white focus:outline-none [&>option]:text-slate-900"
            >
              {events
                .slice()
                .sort((a, b) => REGIONS.findIndex((r) => r.code === a.region) - REGIONS.findIndex((r) => r.code === b.region))
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.region} · {e.city || 'City TBC'}
                    {e.venue ? ` · ${e.venue}` : ''}
                  </option>
                ))}
            </select>
          </label>

          <button
            onClick={() => dispatch({ type: 'event/status', eventId: event.id, status: paused ? 'live' : 'paused' })}
            className={cn('flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold uppercase tracking-wider ring-1 ring-inset transition', paused ? 'bg-amber-400 text-amber-950 ring-amber-300' : 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/40')}
            aria-label={paused ? 'Pledges paused — resume' : 'Event live — pause pledges'}
            title="Alt+P"
          >
            <span className={cn('h-2.5 w-2.5 rounded-full', paused ? 'bg-amber-900' : 'anim-live-dot bg-emerald-300')} />
            {paused ? 'Paused' : 'Live'}
          </button>

          {event.demo.running && <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#1d1403]">Demo running</span>}

          <SyncChip />

          <nav className="ml-auto flex items-center gap-1.5" aria-label="Operator navigation">
            <TopLink onClick={openLiveDisplay} icon="monitor" label="Open live display" />
            <TopLink href={routeHref('/give')} icon="phone" label="Guest pledge page" newTab />
            {page === 'dashboard' ? <TopLink href={routeHref('/admin/settings')} icon="settings" label="Settings" /> : <TopLink href={routeHref('/admin')} icon="gauge" label="Dashboard" />}
            <TopLink onClick={lockAdmin} icon="lock" label="Lock" />
          </nav>
        </div>
        {status.error && <p className="bg-amber-400 px-6 py-1.5 text-center text-sm font-medium text-amber-950">{status.error}</p>}
      </header>
      <main id="main" className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}

function TopLink({ href, onClick, icon, label, newTab }: { href?: string; onClick?: () => void; icon: Parameters<typeof Icon>[0]['name']; label: string; newTab?: boolean }) {
  const cls = 'flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white';
  const content = (
    <>
      <Icon name={icon} className="h-[18px] w-[18px]" />
      <span className="hidden xl:inline">{label}</span>
    </>
  );
  return href ? (
    <a href={href} className={cls} target={newTab ? '_blank' : undefined} rel={newTab ? 'noreferrer' : undefined} aria-label={label} title={label}>
      {content}
    </a>
  ) : (
    <button onClick={onClick} className={cls} aria-label={label} title={label}>
      {content}
    </button>
  );
}

function SyncChip() {
  const status = useSyncStatus();
  const label =
    status.mode === 'local'
      ? 'Same-browser sync'
      : !status.online
        ? status.pending
          ? `Offline · ${status.pending} waiting`
          : 'Reconnecting…'
        : status.pending
          ? `Syncing ${status.pending}…`
          : 'Venue sync connected';
  const ok = status.mode === 'local' || status.online;
  return (
    <span
      className={cn('flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold', ok ? 'bg-white/10 text-white/80' : 'bg-amber-400/90 text-amber-950')}
      title={status.mode === 'local' ? 'Changes sync to other tabs/windows of this browser. Run the sync server for multi-device use.' : 'Connected to the event sync server.'}
    >
      <Icon name={ok ? 'wifi' : 'wifiOff'} className="h-4 w-4" />
      {label}
    </span>
  );
}
