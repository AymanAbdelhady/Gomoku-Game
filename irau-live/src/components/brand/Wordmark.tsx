import { cn } from '../../utils/cn';

/**
 * Typographic organisation lockup. Deliberately text-only: the official
 * Islamic Relief logo artwork should be supplied by the brand team and placed
 * in /public if required (see README → Branding).
 */
export function Wordmark({ organisation, tone = 'light', size = 'md', className }: { organisation: string; tone?: 'light' | 'dark'; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const words = organisation.trim().split(/\s+/);
  const last = words.length > 1 ? words.pop() : '';
  const first = words.join(' ');
  return (
    <span
      className={cn(
        'inline-flex items-center gap-3 uppercase',
        tone === 'light' ? 'text-white' : 'text-navy',
        size === 'sm' && 'text-[11px] tracking-[0.2em]',
        size === 'md' && 'text-[13px] tracking-[0.22em]',
        size === 'lg' && 'text-[22px] tracking-[0.26em]',
        className,
      )}
    >
      <StarEmblem className={cn('shrink-0', size === 'lg' ? 'h-8 w-8' : size === 'md' ? 'h-5 w-5' : 'h-4 w-4', tone === 'light' ? 'text-teal' : 'text-brand')} />
      <span className="font-bold">{first}</span>
      {last && <span className={cn('font-medium', tone === 'light' ? 'text-white/60' : 'text-navy/60')}>{last}</span>}
    </span>
  );
}

/** Small original emblem: an eight-point star (khatam) — not the organisation's logo. */
export function StarEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
        <rect x="7" y="7" width="18" height="18" />
        <rect x="7" y="7" width="18" height="18" transform="rotate(45 16 16)" />
      </g>
      <circle cx="16" cy="16" r="3" fill="currentColor" />
    </svg>
  );
}
