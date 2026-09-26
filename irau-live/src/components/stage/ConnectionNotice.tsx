import { useEffect, useRef, useState } from 'react';
import type { SyncStatus } from '../../state/store/types';
import { cn } from '../../utils/cn';

/**
 * Discreet connection state for the big screen. The display keeps showing the
 * last known total while offline — it never goes blank.
 */
export function ConnectionNotice({ status }: { status: SyncStatus }) {
  const [showOffline, setShowOffline] = useState(false);
  const [restored, setRestored] = useState(false);
  const lastReconnects = useRef(status.reconnects);

  useEffect(() => {
    if (status.online) {
      setShowOffline(false);
      return;
    }
    const t = window.setTimeout(() => setShowOffline(true), 2500);
    return () => window.clearTimeout(t);
  }, [status.online]);

  useEffect(() => {
    if (status.reconnects > lastReconnects.current) {
      lastReconnects.current = status.reconnects;
      setRestored(true);
      const t = window.setTimeout(() => setRestored(false), 4000);
      return () => window.clearTimeout(t);
    }
  }, [status.reconnects]);

  const offlineText = status.mode === 'server' ? 'Reconnecting · showing last confirmed total' : 'Offline · this screen is still up to date';
  const visible = showOffline || restored;
  return (
    <div aria-live="polite" className={cn('absolute bottom-[26px] right-[120px] z-50 transition-all duration-500', visible ? 'opacity-100' : 'translate-y-2 opacity-0')}>
      {visible && (
        <span className="flex items-center gap-3 rounded-full bg-black/50 px-5 py-2 text-[18px] font-medium text-white/85 ring-1 ring-white/15 backdrop-blur">
          <span className={cn('h-2.5 w-2.5 rounded-full', showOffline ? 'anim-breathe bg-amber-300' : 'bg-teal')} aria-hidden="true" />
          {showOffline ? offlineText : 'Connection restored'}
        </span>
      )}
    </div>
  );
}
