import { useEffect, useMemo, useState, type ComponentType } from 'react';
import type { FundraisingEvent, SlideId } from '../../types';
import type { SyncStatus } from '../../state/store/types';
import type { StageData } from './stageTypes';
import { getActiveLevel, getTotals } from '../../state/selectors';
import { useGiftWindow, useNow, usePrefersReducedMotion } from '../../utils/hooks';
import { useGiftQueue } from './celebration/useGiftQueue';
import { PledgeSpotlight } from './PledgeSpotlight';
import { StageBackground } from './StageBackground';
import { cn } from '../../utils/cn';
import { StageHeader } from './StageHeader';
import { OverlayView, useOverlayQueue } from './OverlayLayer';
import { ConnectionNotice } from './ConnectionNotice';
import { CelebrationLayer } from './celebration/CelebrationLayer';
import { MainSlide } from './slides/MainSlide';
import { AppealSlide } from './slides/AppealSlide';
import { ImpactSlide } from './slides/ImpactSlide';
import { LevelsSlide } from './slides/LevelsSlide';
import { DonorsSlide } from './slides/DonorsSlide';
import { QrSlide } from './slides/QrSlide';
import { MilestoneSlide, ThankYouSlide } from './slides/GratitudeSlides';

const SLIDES: Record<SlideId, ComponentType<{ data: StageData }>> = {
  main: MainSlide,
  appeal: AppealSlide,
  impact: ImpactSlide,
  levels: LevelsSlide,
  donors: DonorsSlide,
  qr: QrSlide,
  thankyou: ThankYouSlide,
  milestone: MilestoneSlide,
};

/**
 * The 1920×1080 live composition. Used full-screen on the projector and as a
 * scaled preview in the operator dashboard.
 */
export function LiveStage({ event: live, status, preview = false }: { event: FundraisingEvent; status?: SyncStatus; preview?: boolean }) {
  const prefersReduced = usePrefersReducedMotion();
  const reduced = prefersReduced || live.display.calmMotion;
  const now = useNow(preview ? 10_000 : 5_000);
  const { gift, waiting } = useGiftQueue(live, reduced);
  // Pledges still queued are held back so the total, bar and feed move as each card lands.
  const event = useMemo(() => {
    if (!waiting.length) return live;
    const held = new Set(waiting.map((d) => d.id));
    return { ...live, donations: live.donations.filter((d) => !held.has(d.id)) };
  }, [live, waiting]);
  const totals = getTotals(event);
  const { current: overlay, leaving } = useOverlayQueue(event.live.overlays);

  const slide: SlideId = event.live.slide === 'appeal' && !getActiveLevel(event) ? 'main' : event.live.slide;
  const transitions = useSlideTransitions(slide);

  const data: StageData = { event, totals, reduced, now, gift, pulseKey: gift?.key ?? 'initial', waiting: waiting.length };
  const gold = !!gift && event.display.goldThreshold > 0 && gift.donation.amount >= event.display.goldThreshold;
  const warm = gold && now - gift!.donation.timestamp < 8000;
  const spotlightOn = useGiftWindow(gift?.key ?? null, 5200);
  // The main slide places the spotlight beside the total; everywhere else it sits bottom-right.
  const cornerSpotlight = slide !== 'main' && slide !== 'thankyou' && slide !== 'milestone';

  return (
    <div className="relative h-full w-full select-none overflow-hidden font-sans text-white" data-motion={reduced ? 'reduced' : 'full'}>
      <StageBackground warm={warm || overlay?.kind === 'milestone'} />
      <StageHeader event={event} />
      {transitions.map(({ id, leaving: out }) => {
        const Slide = SLIDES[id];
        return (
          <div key={id} className={out ? 'anim-slide-out pointer-events-none absolute inset-0' : 'anim-slide-in absolute inset-0'} aria-hidden={out || !!overlay || undefined}>
            {/* The slide steps back while a milestone / thank-you moment has the stage. */}
            <div className={cn('absolute inset-0 transition-[opacity,filter] duration-700', overlay && !leaving ? 'opacity-0 blur-md' : 'opacity-100')}>
              <Slide data={data} />
            </div>
          </div>
        );
      })}
      {cornerSpotlight && !overlay && (
        <div className="pointer-events-none absolute bottom-[196px] right-[120px] z-20">
          <PledgeSpotlight gift={gift} visible={spotlightOn} gold={gold} waiting={waiting.length} variant="corner" />
        </div>
      )}
      <CelebrationLayer gift={gift} goldThreshold={event.display.goldThreshold} level={event.display.celebration} enabled={!reduced && !overlay} />
      {overlay && <OverlayView key={overlay.id} overlay={overlay} leaving={leaving} />}
      {status && !preview && <ConnectionNotice status={status} />}
    </div>
  );
}

/** Keeps the outgoing slide mounted briefly so slides cross-fade. */
function useSlideTransitions(slide: SlideId) {
  const [items, setItems] = useState<{ id: SlideId; leaving: boolean }[]>([{ id: slide, leaving: false }]);
  useEffect(() => {
    setItems((prev) => {
      if (prev.some((p) => p.id === slide && !p.leaving)) return prev;
      return [...prev.filter((p) => p.id !== slide).map((p) => ({ ...p, leaving: true })), { id: slide, leaving: false }];
    });
    const t = window.setTimeout(() => setItems((prev) => prev.filter((p) => !p.leaving)), 650);
    return () => window.clearTimeout(t);
  }, [slide]);
  return items;
}
