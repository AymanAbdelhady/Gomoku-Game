import type { FundraisingEvent } from '../../types';
import { Wordmark } from '../brand/Wordmark';

export function StageHeader({ event }: { event: FundraisingEvent }) {
  const place = [event.city, event.venue].filter((s) => s && !s.startsWith('[')).join(' · ');
  return (
    <header className="absolute inset-x-[120px] top-[64px] flex items-center justify-between">
      <div className="flex items-center gap-7">
        <Wordmark organisation={event.organisation} size="lg" />
        {place && (
          <>
            <span className="h-7 w-px bg-white/20" aria-hidden="true" />
            <span className="text-[22px] font-medium tracking-wide text-white/55">{place}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-5">
        {event.demo.running && (
          <span className="eyebrow rounded-full px-4 py-1.5 text-[15px] text-gold ring-1 ring-gold/50">Demo mode · simulated gifts</span>
        )}
        <span className="eyebrow flex items-center gap-3 text-[17px] text-white/70">
          <span className="anim-live-dot h-3 w-3 rounded-full bg-teal" aria-hidden="true" />
          Live
        </span>
      </div>
    </header>
  );
}
