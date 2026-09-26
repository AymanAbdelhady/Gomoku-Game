import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import type { FundraisingEvent, SlideId } from '../../types';
import type { SyncStatus } from '../../state/store/types';
import type { Gift, StageData } from './stageTypes';
import { getActiveLevel, getTotals } from '../../state/selectors';
import { useNow, usePrefersReducedMotion } from '../../utils/hooks';
import { StageBackground } from './StageBackground';
import { cn } from '../../utils/cn';
import { StageHeader } from './StageHeader';
import { OverlayView, useOverlayQueue } from './OverlayLayer';
import { ConnectionNotice } from './ConnectionNotice';
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

/** How recent a gift must be to be celebrated when it arrives (avoids replaying history). */
const CELEBRATE_WINDOW_MS = 60_000;

/**
 * The 1920×1080 live composition. Used full-screen on the projector and as a
 * scaled preview in the operator dashboard.
 */
export function LiveStage({ event, status, preview = false }: { event: FundraisingEvent; status?: SyncStatus; preview?: boolean }) {
  const prefersReduced = usePrefersReducedMotion();
  const reduced = prefersReduced || event.display.calmMotion;
  const now = useNow(preview ? 10_000 : 5_000);
  const totals = getTotals(event);
  const gift = useNewGift(event);
  const { current: overlay, leaving } = useOverlayQueue(event.live.overlays);

  const slide: SlideId = event.live.slide === 'appeal' && !getActiveLevel(event) ? 'main' : event.live.slide;
  const transitions = useSlideTransitions(slide);

  const data: StageData = { event, totals, reduced, now, gift, pulseKey: gift?.key ?? 'initial' };
  const warm = !!gift && event.display.goldThreshold > 0 && gift.donation.amount >= event.display.goldThreshold && now - gift.donation.timestamp < 8000;

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
      {overlay && <OverlayView key={overlay.id} overlay={overlay} leaving={leaving} />}
      {status && !preview && <ConnectionNotice status={status} />}
    </div>
  );
}

/** Detects gifts that arrive while the screen is open. */
function useNewGift(event: FundraisingEvent): Gift | null {
  const known = useRef<Set<string> | null>(null);
  const [gift, setGift] = useState<Gift | null>(null);
  if (known.current === null) known.current = new Set(event.donations.map((d) => d.id));

  useEffect(() => {
    const fresh = event.donations.filter((d) => !known.current!.has(d.id));
    fresh.forEach((d) => known.current!.add(d.id));
    const newest = fresh.filter((d) => Date.now() - d.timestamp < CELEBRATE_WINDOW_MS).pop();
    if (newest) setGift({ donation: newest, key: `${newest.id}-${Date.now()}` });
  }, [event.donations]);

  return useMemo(() => (gift && event.donations.some((d) => d.id === gift.donation.id) ? gift : null), [gift, event.donations]);
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
