import type { StageData } from '../stageTypes';
import { TotalRibbon } from '../TotalRibbon';
import { PartnerStrip } from '../../brand/BrandLogo';
import { publicText } from '../../../utils/content';
import { money } from '../../../utils/format';

/** "Your generosity saves lives" — only confirmed impact statements are shown. */
export function ImpactSlide({ data }: { data: StageData }) {
  const { event } = data;
  const slide = event.slides.find((s) => s.id === 'impact');
  const oneOff = event.impactMessages.filter((m) => m.frequency === 'one-off' && publicText(m.text)).sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0)).slice(0, 4);
  const monthly = event.impactMessages.filter((m) => m.frequency === 'monthly' && publicText(m.text)).sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0)).slice(0, 4);
  const statement = publicText(event.campaignStatement);

  return (
    <div className="absolute inset-0">
      <div className="absolute left-[120px] top-[190px] w-[1680px]">
        <p className="eyebrow anim-rise text-[22px] text-teal">{publicText(event.partnerLine) || event.name}</p>
        <h2 className="anim-rise mt-5 font-display text-[96px] font-[500] leading-[1.02] tracking-[-0.015em] text-white" style={{ animationDelay: '100ms' }}>
          {slide?.title}
        </h2>
        <div className="mt-8 grid grid-cols-[1fr_1fr] gap-16">
          {statement && (
            <blockquote className="anim-rise border-l-2 border-teal/60 pl-8 font-display text-[36px] italic leading-snug text-white/80" style={{ animationDelay: '200ms' }}>
              {statement}
            </blockquote>
          )}
          <p className="anim-rise text-[30px] leading-snug text-white/65" style={{ animationDelay: '260ms' }}>
            {slide?.subtitle}
          </p>
        </div>

        {oneOff.length > 0 && (
          <div className="mt-14 grid grid-cols-4 gap-6">
            {oneOff.map((m, i) => (
              <div key={m.id} className="anim-rise rounded-3xl bg-white/[0.05] p-8 ring-1 ring-white/10" style={{ animationDelay: `${340 + i * 90}ms` }}>
                <p className="tabular text-[58px] font-semibold leading-none text-white">{m.amount ? money(m.amount) : ''}</p>
                <p className="mt-4 text-[25px] leading-snug text-white/70">{m.text}</p>
              </div>
            ))}
          </div>
        )}
        {monthly.length > 0 && (
          <p className="anim-rise mt-8 text-[23px] text-white/55" style={{ animationDelay: '800ms' }}>
            <span className="eyebrow mr-4 text-[17px] text-teal">Monthly</span>
            {monthly.map((m, i) => (
              <span key={m.id}>
                {i > 0 && <span className="mx-3 text-white/25">·</span>}
                <span className="tabular font-semibold text-white/85">{m.amount ? money(m.amount) : ''}</span> {m.text.charAt(0).toLowerCase() + m.text.slice(1)}
              </span>
            ))}
          </p>
        )}
      </div>
      <PartnerStrip logos={event.assets.partnerLogos} size={48} label="With" className="absolute right-[120px] top-[176px]" />
      <TotalRibbon data={data} />
    </div>
  );
}
