import type { StageData } from '../stageTypes';
import { AnimatedAmount } from '../AnimatedAmount';
import { PartnerStrip } from '../../brand/BrandLogo';
import { lastReachedMilestone } from '../../../state/selectors';
import { publicText } from '../../../utils/content';
import { formatNumber, money, percent } from '../../../utils/format';

const ARABIC_JAZAKUM = 'جزاكم الله خيرًا';

export function ThankYouSlide({ data }: { data: StageData }) {
  const { event, totals, reduced } = data;
  const slide = event.slides.find((s) => s.id === 'thankyou');
  const quote = publicText(event.display.adminQuote);
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
      <Rings />
      {/jazak/i.test(slide?.title ?? '') && (
        <p lang="ar" dir="rtl" className="anim-rise font-arabic text-[64px] leading-none text-gold/90">
          {ARABIC_JAZAKUM}
        </p>
      )}
      <h2 className="anim-rise mt-8 font-display text-[132px] font-[480] leading-none tracking-[-0.02em] text-white" style={{ animationDelay: '120ms' }}>
        {slide?.title}
      </h2>
      <p className="anim-rise mt-8 max-w-[1300px] text-[40px] leading-snug text-white/70" style={{ animationDelay: '240ms' }}>
        {slide?.subtitle}
      </p>
      <div className="anim-rise mt-16 flex items-end gap-24" style={{ animationDelay: '380ms' }}>
        <div>
          <p className="eyebrow text-[20px] text-teal">Pledged tonight</p>
          <AnimatedAmount value={totals.raised} reduced={reduced} className="mt-3 text-[110px] font-semibold tracking-[-0.03em] text-white" />
        </div>
        <div className="pb-3 text-left">
          <p className="tabular text-[56px] font-semibold leading-none text-white">{formatNumber(totals.donorCount)}</p>
          <p className="eyebrow mt-3 text-[18px] text-white/55">Pledges</p>
        </div>
        <div className="pb-3 text-left">
          <p className="tabular text-[56px] font-semibold leading-none text-white">{percent(totals.progress, 0)}</p>
          <p className="eyebrow mt-3 text-[18px] text-white/55">Of {money(totals.target)}</p>
        </div>
      </div>
      <PartnerStrip logos={event.assets.partnerLogos} size={52} className="anim-rise mt-14" />
      {quote && (
        <figure className="anim-rise mt-16 max-w-[1200px]" style={{ animationDelay: '520ms' }}>
          <blockquote className="font-display text-[32px] italic leading-snug text-white/75">{quote}</blockquote>
          {event.display.adminQuoteSource && <figcaption className="mt-3 text-[20px] text-white/50">{event.display.adminQuoteSource}</figcaption>}
        </figure>
      )}
    </div>
  );
}

export function MilestoneSlide({ data }: { data: StageData }) {
  const { event, totals, reduced } = data;
  const slide = event.slides.find((s) => s.id === 'milestone');
  const milestone = lastReachedMilestone(event);
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
      <Rings gold />
      <p className="eyebrow anim-rise text-[26px] text-gold">{milestone ? `${event.name} · milestone` : 'Pledged so far'}</p>
      <div className="anim-rise mt-6 flex items-baseline gap-8" style={{ animationDelay: '120ms' }}>
        {milestone ? (
          <span className="tabular text-[220px] font-semibold leading-none tracking-[-0.04em] text-white text-glow">{money(milestone.amount)}</span>
        ) : (
          <AnimatedAmount value={totals.raised} reduced={reduced} className="text-[220px] font-semibold tracking-[-0.04em] text-white" />
        )}
      </div>
      <p className="eyebrow anim-rise mt-2 text-[56px] tracking-[0.3em] text-white/85" style={{ animationDelay: '200ms' }}>
        Pledged
      </p>
      <h2 className="anim-rise mt-14 font-display text-[88px] font-[480] leading-none text-white" style={{ animationDelay: '320ms' }}>
        {slide?.title}
      </h2>
      <p className="anim-rise mt-6 text-[38px] text-white/70" style={{ animationDelay: '420ms' }}>
        {slide?.subtitle}
      </p>
    </div>
  );
}

/** Concentric geometric rings — quiet celebration, no confetti. */
export function Rings({ gold = false }: { gold?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-[1100px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: `radial-gradient(closest-side, color-mix(in oklab, var(${gold ? '--color-gold' : '--color-brand'}) 22%, transparent), transparent)` }} />
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="motion-decor absolute left-1/2 top-1/2 block h-[900px] w-[900px] rounded-full border"
          style={{ borderColor: gold ? 'color-mix(in oklab, var(--color-gold) 45%, transparent)' : 'rgba(255,255,255,.18)', animation: `ring-out 6s ${i * 2}s var(--ease-calm) infinite both` }}
        />
      ))}
    </div>
  );
}
