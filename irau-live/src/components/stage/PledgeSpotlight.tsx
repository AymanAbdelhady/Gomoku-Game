import type { Gift } from './stageTypes';
import { publicDonorName } from '../../utils/content';
import { money } from '../../utils/format';
import { cn } from '../../utils/cn';
import { HeartIcon } from './GiftCelebration';

/**
 * The card each new pledge arrives on: who pledged, how much, and whether it
 * came from a phone. It springs in, the celebration's light leaves from it,
 * and a "+N more" badge shows when more pledges are queued behind it.
 */
export function PledgeSpotlight({ gift, visible, gold, impact, waiting, variant = 'main' }: { gift: Gift | null; visible: boolean; gold: boolean; impact?: string; waiting: number; variant?: 'main' | 'corner' }) {
  if (!gift) return null;
  const d = gift.donation;
  const name = publicDonorName(d);
  const anonymous = name === 'Anonymous';
  const fromPhone = d.source === 'app' || !!d.viaPhone;
  const line = d.levelId ? 'Answered the appeal' : fromPhone ? 'Pledged from their phone' : 'Just pledged';

  return (
    <div aria-live="polite" className={cn('transition-all duration-700', visible ? 'opacity-100' : 'pointer-events-none translate-y-3 opacity-0', variant === 'corner' && 'origin-bottom-right scale-[0.82]')}>
      <div key={gift.key} className="flex items-center gap-8" style={{ animation: 'card-pop 0.9s 0.18s cubic-bezier(0.34, 1.4, 0.5, 1) both' }}>
        <div
          data-celebrate="spotlight"
          className={cn('relative flex shrink-0 items-center gap-6 overflow-hidden rounded-[34px] py-4 pl-4 pr-10 ring-1 backdrop-blur-md', gold ? 'bg-gold/15 ring-gold/45' : 'bg-white/[0.09] ring-white/15')}
        >
          <span className="motion-decor pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" style={{ animation: 'shimmer 1.4s 0.3s ease-out both' }} />
          <span className="relative">
            <span
              className={cn('grid h-[88px] w-[88px] place-items-center rounded-full text-[42px] font-bold', gold ? 'text-[#1d1403]' : 'text-white')}
              style={{
                background: gold ? 'linear-gradient(135deg, #ffe3a3, var(--color-gold))' : 'linear-gradient(135deg, var(--color-teal), var(--color-brand))',
                boxShadow: `0 0 40px ${gold ? 'color-mix(in oklab, var(--color-gold) 60%, transparent)' : 'color-mix(in oklab, var(--color-brand) 60%, transparent)'}`,
              }}
              aria-hidden="true"
            >
              {anonymous ? <HeartIcon className="h-10 w-10" /> : name.charAt(0).toUpperCase()}
            </span>
            {fromPhone && (
              <span className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-white text-navy shadow-lg" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="7" y="2" width="10" height="20" rx="2.5" />
                  <path d="M11 18h2" />
                </svg>
              </span>
            )}
          </span>
          <span className="min-w-0">
            <span className="block max-w-[420px] truncate text-[40px] font-semibold leading-tight text-white">{name}</span>
            <span className={cn('eyebrow mt-1 block text-[16px]', gold ? 'text-gold' : 'text-teal')}>{line}</span>
          </span>
          <span className={cn('tabular ml-4 text-[58px] font-bold leading-none tracking-tight', gold ? 'text-gold' : 'text-white')}>{money(d.amount)}</span>
          {waiting > 0 && (
            <span className="anim-breathe absolute right-3 top-3 rounded-full bg-white px-3 py-0.5 text-[15px] font-bold text-navy">+{waiting} more</span>
          )}
        </div>
        {impact && variant === 'main' && <p className="max-w-[360px] font-display text-[26px] italic leading-tight text-teal">{impact}</p>}
      </div>
    </div>
  );
}
