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
import { enabledMilestones, impactFor, recentDonations } from '../../../state/selectors';
import { formatNumber, money, percent } from '../../../utils/format';
import { useAnimatedNumber, useGiftWindow } from '../../../utils/hooks';
import { cn } from '../../../utils/cn';

export function MainSlide({ data }: { data: StageData }) {
  const { event, totals, reduced, now, gift, pulseKey, waiting } = data;
  const link = useGuestLink(event);
  const slide = event.slides.find((s) => s.id === 'main');
  const gold = !!gift && event.display.goldThreshold > 0 && gift.donation.amount >= event.display.goldThreshold;
  const freshGift = gift && now - gift.donation.timestamp < 15_000 ? gift : null;
  const impact = freshGift && event.display.showImpactOnGift ? impactFor(event, freshGift.donation.amount) : '';
  const donorsShown = useAnimatedNumber(totals.donorCount, reduced, 900);
  const exceeded = totals.progress >= 1;
  const toastVisible = useGiftWindow(freshGift?.key ?? null, 5200);

  return (
    <div className="absolute inset-0">
      {freshGift && gold && <GoldMotes gift={freshGift} />}

      {/* Left: story + total */}
      <section className="absolute left-[120px] top-[190px] w-[1060px]">
        <h1 className="font-display text-[112px] font-[520] leading-[0.98] tracking-[-0.02em] text-white" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
          {slide?.title || event.name}
        </h1>
        <p className="mt-6 max-w-[900px] text-[34px] leading-snug text-white/70">{slide?.subtitle || event.tagline}</p>

        <div className="mt-[62px]">
          <p className="eyebrow text-[22px] text-teal">Pledged tonight</p>
          <Pop trigger={pulseKey} celebrate="total" className="relative mt-3">
            <AnimatedAmount
              value={totals.raised}
              reduced={reduced}
              className={cn('text-[210px] font-semibold tracking-[-0.035em] transition-colors duration-1000', gold ? 'text-[color-mix(in_oklab,var(--color-gold)_55%,white)]' : 'text-white', 'text-glow')}
            />
          </Pop>
          <p className="mt-5 text-[34px] text-white/60">
            of <span className="tabular font-semibold text-white/90">{money(totals.target)}</span> target
          </p>
        </div>
      </section>

      {/* Stats, which make way for the gift acknowledgement while it is showing */}
      <div className={cn('absolute left-[120px] top-[800px] w-[1060px] transition-all', toastVisible ? 'translate-y-4 opacity-0 duration-200' : 'opacity-100 duration-700')}>
        <div className="flex items-end gap-14">
          <Stat value={percent(totals.progress)} label={exceeded ? 'Target reached' : 'Of target'} highlight={exceeded} />
          <Pop trigger={pulseKey} scale={1.12}>
            <Stat value={formatNumber(donorsShown)} label={Math.round(donorsShown) === 1 ? 'Pledge' : 'Pledges'} />
          </Pop>
          {!exceeded && <Stat value={money(totals.remaining)} label="To go" />}
          <MomentumMeter donations={event.donations} now={now} pulseKey={pulseKey} />
        </div>
      </div>
      <div className="absolute left-[1290px] top-[190px] w-[510px]">
        <p className="eyebrow mb-7 text-[20px] text-white/55">Recent pledges</p>
        <GivingFeed
          donations={recentDonations(event, 8)}
          now={now}
          showAmounts={event.display.showAmounts}
          goldThreshold={event.display.goldThreshold}
          rows={event.display.cornerQr ? 4 : 6}
          reduced={reduced}
        />
        {event.display.cornerQr && link.url && (
          <div className="mt-8 flex items-center gap-6 rounded-3xl bg-white/[0.05] p-5 ring-1 ring-white/10">
            <div className="rounded-2xl bg-white p-2.5">
              <QrCode value={link.url} size={128} />
            </div>
            <div>
              <p className="eyebrow text-[18px] text-teal">{link.pledging ? 'Scan to pledge' : 'Scan to give'}</p>
              {link.pledging ? (
                <>
                  <p className="mt-1 text-[24px] font-medium text-white">
                    Code <span className="tabular font-bold tracking-[0.12em]">{event.pledging.code}</span>
                  </p>
                  {event.joinedCount > 0 && <p className="mt-1 text-[18px] text-white/55">{event.joinedCount} {event.joinedCount === 1 ? 'guest' : 'guests'} joined</p>}
                </>
              ) : (
                <p className="mt-1 text-[24px] font-medium leading-snug text-white">{event.qrLabel || 'Donate now'}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute left-[120px] top-[798px] w-[1140px]">
        <PledgeSpotlight gift={freshGift} impact={impact} gold={gold} visible={toastVisible} waiting={waiting} />
      </div>

      <div className="absolute inset-x-[120px] bottom-[64px]">
        <ProgressTrack
          raised={totals.raised}
          target={totals.target}
          milestones={enabledMilestones(event)}
          pulseKey={pulseKey}
          showNextMilestone
        />
      </div>
    </div>
  );
}

function Stat({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div>
      <p className={cn('tabular text-[54px] font-semibold leading-none', highlight ? 'text-gold' : 'text-white')}>{value}</p>
      <p className="eyebrow mt-3 text-[17px] text-white/50">{label}</p>
    </div>
  );
}
