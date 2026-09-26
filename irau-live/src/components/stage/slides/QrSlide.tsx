import type { StageData } from '../stageTypes';
import { TotalRibbon } from '../TotalRibbon';
import { QrCode } from '../../ui/QrCode';
import { qrTarget } from '../../../state/selectors';

export function QrSlide({ data }: { data: StageData }) {
  const { event } = data;
  const slide = event.slides.find((s) => s.id === 'qr');
  const url = qrTarget(event);
  return (
    <div className="absolute inset-0">
      <div className="absolute left-[120px] top-[230px] w-[900px]">
        <p className="eyebrow anim-rise text-[24px] text-teal">{event.name}</p>
        <h2 className="anim-rise mt-8 font-display text-[92px] font-[500] leading-[1.02] tracking-[-0.015em] text-white" style={{ animationDelay: '100ms' }}>
          {slide?.title}
        </h2>
        <div className="anim-rise mt-12 flex items-center gap-8" style={{ animationDelay: '220ms' }}>
          <span className="eyebrow whitespace-nowrap rounded-full bg-brand px-10 py-5 text-[30px] text-white shadow-[0_20px_60px_-20px_var(--color-brand)]">{slide?.subtitle || 'Donate now'}</span>
          <span className="flex items-center gap-4 text-[28px] text-white/60">
            <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <rect x="6" y="2" width="12" height="20" rx="3" />
              <path d="M10 18h4" />
            </svg>
            Point your phone camera at the code
          </span>
        </div>
      </div>
      <div className="anim-rise absolute right-[140px] top-[170px] flex flex-col items-center" style={{ animationDelay: '160ms' }}>
        <div className="rounded-[44px] bg-white p-8 shadow-[0_40px_120px_-30px_rgba(7,120,212,.6)]">
          {url ? <QrCode value={url} size={560} /> : <div className="grid h-[560px] w-[560px] place-items-center text-[28px] text-slate-500">Add a donation URL in Settings</div>}
        </div>
        <p className="mt-7 text-[30px] font-semibold tracking-wide text-white">{event.organisation}</p>
        {event.qrLabel && <p className="mt-1 text-[24px] text-white/55">{event.qrLabel}</p>}
      </div>
      <TotalRibbon data={data} />
    </div>
  );
}
