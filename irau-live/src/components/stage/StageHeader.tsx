import type { FundraisingEvent } from '../../types';
import { BrandLogo } from '../brand/BrandLogo';

export function StageHeader({ event }: { event: FundraisingEvent }) {
  const place = event.layout.showLocation ? [event.city, event.venue].filter((s) => s && !s.startsWith('[')).join(' · ') : '';
  return (
    <header className="absolute inset-x-[120px] top-[56px] flex h-[72px] items-center justify-between">
      <div className="flex items-center gap-7">
        <BrandLogo event={event} height={event.assets.logo ? event.assets.logoHeight : 56} />
        {place && (
          <>
            <span className="h-8 w-px bg-white/20" aria-hidden="true" />
            <span className="text-[22px] font-medium tracking-wide text-white/55">{place}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-5">
        {event.demo.running && <span className="eyebrow rounded-full px-4 py-1.5 text-[14px] text-gold/90 ring-1 ring-gold/40">Demo</span>}
        <span className="eyebrow flex items-center gap-3 text-[17px] text-white/70">
          <span className="anim-live-dot h-3 w-3 rounded-full bg-teal" aria-hidden="true" />
          Live
        </span>
      </div>
    </header>
  );
}
