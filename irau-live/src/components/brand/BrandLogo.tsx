import type { FundraisingEvent } from '../../types';
import { Wordmark } from './Wordmark';
import { cn } from '../../utils/cn';

/**
 * The organisation's uploaded logo, or the text wordmark when none is set.
 * On dark surfaces a logo can be knocked out to white (Settings → Appearance).
 */
export function BrandLogo({ event, height, tone = 'light', className }: { event: FundraisingEvent; height: number; tone?: 'light' | 'dark'; className?: string }) {
  const { logo, logoStyle, showOrgName } = event.assets;
  if (!logo) return <Wordmark organisation={event.organisation} tone={tone} size={height >= 48 ? 'lg' : height >= 24 ? 'md' : 'sm'} className={className} />;
  const white = logoStyle === 'white' && tone === 'light';
  return (
    <span className={cn('inline-flex items-center', className)} style={{ gap: height * 0.35 }}>
      <img src={logo} alt={event.organisation} style={{ height, width: 'auto', maxWidth: height * 7, objectFit: 'contain', filter: white ? 'brightness(0) invert(1)' : undefined }} />
      {showOrgName && (
        <span className={cn('font-semibold uppercase tracking-[0.2em]', tone === 'light' ? 'text-white' : 'text-navy')} style={{ fontSize: Math.max(11, height * 0.34) }}>
          {event.organisation}
        </span>
      )}
    </span>
  );
}

/** Partner / sponsor logos on white plates, so any logo reads on the dark stage. */
export function PartnerStrip({ logos, label = 'In partnership with', size = 64, className }: { logos: string[]; label?: string; size?: number; className?: string }) {
  if (!logos.length) return null;
  return (
    <div className={cn('flex items-center gap-6', className)}>
      <span className="eyebrow text-[18px] text-white/55">{label}</span>
      {logos.map((src, i) => (
        <span key={i} className="grid place-items-center rounded-2xl bg-white px-5" style={{ height: size + 20 }}>
          <img src={src} alt="Partner logo" style={{ height: size, width: 'auto', maxWidth: size * 4, objectFit: 'contain' }} />
        </span>
      ))}
    </div>
  );
}
