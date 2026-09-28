import { useEffect } from 'react';
import { ScaledStage } from '../components/stage/ScaledStage';
import { LiveStage } from '../components/stage/LiveStage';
import { useActiveEvent, useSyncStatus } from '../state/StoreContext';
import { useIdleCursor } from '../utils/hooks';
import { cn } from '../utils/cn';

/**
 * Full-screen audience display. Read-only: it never writes event data.
 * Keys: F = full screen.
 */
export function LiveDisplay() {
  const event = useActiveEvent();
  const status = useSyncStatus();
  const idle = useIdleCursor();

  useEffect(() => {
    document.title = `${event.name} · Live`;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [event.name]);

  return (
    <main className={cn('fixed inset-0 bg-[color-mix(in_oklab,var(--color-ink)_75%,black)]', idle && 'cursor-none')} aria-label={`${event.name} live fundraising display`}>
      <ScaledStage className="h-full w-full">
        <LiveStage event={event} status={status} />
      </ScaledStage>
      <p className={cn('pointer-events-none fixed bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-xs text-white/70 transition-opacity duration-700', idle ? 'opacity-0' : 'opacity-100')}>
        Press <kbd className="font-semibold text-white">F</kbd> for full screen
      </p>
    </main>
  );
}
