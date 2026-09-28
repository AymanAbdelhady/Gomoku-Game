import type { StageData } from '../stageTypes';
import { AnimatedAmount } from '../AnimatedAmount';
import { ProgressTrack } from '../ProgressTrack';
import { GivingFeed } from '../GivingFeed';
import { MomentumMeter } from '../MomentumMeter';
import { Pop } from '../Pop';
import { GoldMotes } from '../GiftCelebration';
import { PledgeSpotlight } from '../PledgeSpotlight';
import { useGuestLink } from '../../../state/useGuestLink';
import { QrCode } from '../../ui/QrCode';
import { enabledMilestones, impactFor, nextMilestone, recentDonations } from '../../../state/selectors';
import { formatNumber, money, moneyCompact, percent } from '../../../utils/format';
import { useAnimatedNumber, useGiftWindow } from '../../../utils/hooks';
import { cn } from '../../../utils/cn';

/**
 * The main live screen, built on fixed zones so nothing competes or overlaps:
 *
 *   header (logo · place · live)
 *   ┌ title ─────────────────────────┐ ┌ recent pledges ┐
 *   │ PLEDGED TONIGHT  $247,850       │ │ …              │
 *   │ 82.6% of $300,000 · 412 pledges │ ├ QR · code ─────┤
 *   ├ moment row: the pledge spotlight, or the next-milestone countdown
 *   └ progress bar ─────────────────────────────────────────────┘
 *
 * What appears is controlled in Settings → Live screen layout.
 */
export function MainSlide({ data }: { data: StageData }) {
  const { event, totals, reduced, now, gift, pulseKey, waiting } = data;
  const { layout } = event;
  const link = useGuestLink(event);
  const slide = event.slides.find((s) => s.id === 'main');
  const gold = !!gift && event.display.goldThreshold > 0 && gift.donation.amount >= event.display.goldThreshold;
  const freshGift = gift && now - gift.donation.timestamp < 15_000 ? gift : null;
  const impact = freshGift && event.display.showImpactOnGift ? impactFor(event, freshGift.donation.amount) : '';
  const countShown = useAnimatedNumber(totals.donorCount, reduced, 900);
  const exceeded = totals.progress >= 1;
  const spotlightOn = useGiftWindow(freshGift?.key ?? null, 5200);
  const next = nextMilestone(event);

  const showQr = layout.showQrPanel && !!link.url;
  const rows = Math.max(0, Math.min(layout.feedRows, showQr ? 4 : 6));
  const totalTop = layout.showSubtitle ? 392 : layout.showTitle ? 330 : 250;

  return (
    <div className="absolute inset-0">
      {freshGift && gold && <GoldMotes gift={freshGift} />}

      {/* Title */}
      {(layout.showTitle || layout.showSubtitle) && (
        <section className="absolute left-[120px] top-[176px] w-[1080px]">
          {layout.showTitle && (
            <h1 className="truncate font-display text-[84px] font-[520] leading-[1.05] tracking-[-0.02em] text-white" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
              {slide?.title || event.name}
            </h1>
          )}
          {layout.showSubtitle && <p className="mt-3 max-w-[1000px] text-[30px] leading-snug text-white/65">{slide?.subtitle || event.tagline}</p>}
        </section>
      )}

      {/* Hero total */}
      <section className="absolute left-[120px] w-[1100px]" style={{ top: totalTop }}>
        <p className="eyebrow text-[22px] text-teal">Pledged tonight</p>
        <Pop trigger={pulseKey} celebrate="total" className="relative mt-2">
          <AnimatedAmount
            value={totals.raised}
            reduced={reduced}
            className={cn('text-[200px] font-semibold tracking-[-0.035em] transition-colors duration-1000', gold ? 'text-[color-mix(in_oklab,var(--color-gold)_55%,white)]' : 'text-white', 'text-glow')}
          />
        </Pop>
        <p className="tabular mt-4 text-[32px] text-white/60">
          <span className={cn('font-semibold', exceeded ? 'text-gold' : 'text-white')}>{percent(totals.progress)}</span> of {money(totals.target)}
          <span className="mx-4 text-white/25">·</span>
          <span className="font-semibold text-white">{formatNumber(countShown)}</span> {Math.round(countShown) === 1 ? 'pledge' : 'pledges'}
        </p>
      </section>

      {/* Moment row: a pledge in the spotlight, otherwise the next milestone */}
      <div className="absolute left-[120px] top-[772px] h-[124px] w-[1140px]">
        <div className={cn('absolute inset-0 flex items-center gap-16 transition-all', spotlightOn ? 'translate-y-3 opacity-0 duration-200' : 'opacity-100 duration-700')}>
          {layout.showCountdown && (exceeded || next) && (
            <div>
              <p className="eyebrow text-[17px] text-white/50">{exceeded ? 'Alhamdulillah' : 'Next milestone'}</p>
              <p className="tabular mt-2 text-[36px] font-semibold text-white">
                {exceeded ? (
                  <span className="text-gold">Target reached — thank you</span>
                ) : (
                  <>
                    {moneyCompact(next!.amount)} <span className="font-normal text-white/55">· {money(next!.amount - totals.raised)} to go</span>
                  </>
                )}
              </p>
            </div>
          )}
          {layout.showMomentum && <MomentumMeter donations={event.donations} now={now} pulseKey={pulseKey} />}
        </div>
        <div className="pointer-events-none absolute inset-0 flex items-center">
          <PledgeSpotlight gift={freshGift} impact={impact} gold={gold} visible={spotlightOn} waiting={waiting} />
        </div>
      </div>

      {/* Right panel: recent pledges + how to join */}
      {(rows > 0 || showQr) && (
        <aside className="absolute right-[120px] top-[176px] w-[510px] overflow-hidden rounded-[32px] bg-white/[0.045] ring-1 ring-white/10">
          {rows > 0 && (
            <div className="px-8 pb-2 pt-7">
              <p className="eyebrow mb-3 text-[18px] text-white/50">Recent pledges</p>
              <GivingFeed donations={recentDonations(event, rows + 2)} now={now} showAmounts={event.display.showAmounts} goldThreshold={event.display.goldThreshold} rows={rows} reduced={reduced} />
            </div>
          )}
          {showQr && (
            <div className={cn(rows > 0 ? 'flex items-center gap-6 border-t border-white/10 p-7' : 'flex flex-col items-center p-10 text-center')}>
              <div className="rounded-2xl bg-white p-2.5">
                <QrCode value={link.url} size={rows > 0 ? 132 : 300} />
              </div>
              <div className={rows > 0 ? undefined : 'mt-6'}>
                <p className="eyebrow text-[17px] text-teal">Scan to pledge</p>
                <p className="mt-1.5 text-[26px] font-medium text-white">
                  Code <span className="tabular font-bold tracking-[0.12em]">{event.pledging.code}</span>
                </p>
                {event.joinedCount > 0 && (
                  <p className="mt-1 text-[18px] text-white/50">
                    {event.joinedCount} {event.joinedCount === 1 ? 'guest' : 'guests'} joined
                  </p>
                )}
              </div>
            </div>
          )}
        </aside>
      )}

      {/* Progress */}
      <div className="absolute inset-x-[120px] bottom-[60px]">
        <ProgressTrack raised={totals.raised} target={totals.target} milestones={enabledMilestones(event)} pulseKey={pulseKey} showLabels={layout.showMilestoneLabels} />
      </div>
    </div>
  );
}
