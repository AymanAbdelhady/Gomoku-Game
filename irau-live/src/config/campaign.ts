import type {
  Appearance,
  BrandAssets,
  BrandColours,
  DisplayOptions,
  GivingLevel,
  ImpactMessage,
  LayoutPreset,
  LiveSlide,
  Milestone,
  StageLayout,
} from '../types/index.ts';

/**
 * Campaign content for "Gaza 3 Years On".
 *
 * CONTENT RULE: every figure and impact claim below comes from Islamic Relief
 * Australia's published campaign material. Anything not supplied is a
 * [PLACEHOLDER] which the app never renders on public screens.
 */

export const PLACEHOLDER = '[IMPACT STATEMENT TO BE CONFIRMED]';

export const CAMPAIGN = {
  name: 'Gaza 3 Years On',
  organisation: 'Islamic Relief Australia',
  tagline: 'Help us continue lifesaving medical support in Gaza.',
  description:
    'Supporting lifesaving medical assistance for people in Gaza, including specialised medical missions and urgently needed medical supplies and equipment through Islamic Relief Australia’s partnership with PANZMA.',
  campaignStatement:
    'Three years on since the escalating violence in Gaza, the people of Palestine remain resilient in the face of relentless adversity.',
  partnerLine: 'Specialised medical missions in partnership with PANZMA',
  donationUrl: 'https://islamicrelief.org.au/',
  qrLabel: 'islamicrelief.org.au',
  target: 300_000,
};

export const BRAND: BrandColours = {
  primary: '#0778D4',
  navy: '#223A7B',
  teal: '#66B3BC',
  gold: '#C9A45C',
  background: '#081530',
};

/** Ready-made colour sets. Backgrounds stay dark so white stage text keeps its contrast. */
export const COLOUR_PRESETS: { id: string; label: string; colours: BrandColours }[] = [
  { id: 'ir', label: 'Islamic Relief', colours: BRAND },
  { id: 'midnight', label: 'Midnight', colours: { primary: '#3D8BFD', navy: '#1B2A4A', teal: '#8FD3E8', gold: '#D4B26A', background: '#05080F' } },
  { id: 'olive', label: 'Olive', colours: { primary: '#2F9E6B', navy: '#1F3B2E', teal: '#9BD1B0', gold: '#D8B45C', background: '#08140F' } },
  { id: 'dusk', label: 'Dusk', colours: { primary: '#7C6FD6', navy: '#2B2356', teal: '#B9A7F0', gold: '#E0B86A', background: '#0D0A1C' } },
];

export const ASSETS: BrandAssets = { logo: '', logoStyle: 'original', logoHeight: 56, showOrgName: true, partnerLogos: [] };

export const APPEARANCE: Appearance = { headingFont: 'serif', backgroundStyle: 'gradient', pattern: true };

/** Layout presets for the main live screen. "Focused" is the calm default. */
export const LAYOUT_PRESETS: Record<Exclude<LayoutPreset, 'custom'>, Omit<StageLayout, 'preset'>> = {
  focused: { showTitle: true, showSubtitle: false, feedRows: 3, showQrPanel: true, showMilestoneLabels: true, showCountdown: true, showMomentum: false, showLocation: true },
  standard: { showTitle: true, showSubtitle: true, feedRows: 4, showQrPanel: true, showMilestoneLabels: true, showCountdown: true, showMomentum: false, showLocation: true },
  detailed: { showTitle: true, showSubtitle: true, feedRows: 5, showQrPanel: true, showMilestoneLabels: true, showCountdown: true, showMomentum: true, showLocation: true },
};

export const LAYOUT: StageLayout = { preset: 'focused', ...LAYOUT_PRESETS.focused };

export const GIVING_LEVELS: Omit<GivingLevel, 'id'>[] = [
  { amount: 10_000, impact: PLACEHOLDER, enabled: true },
  { amount: 5_000, impact: PLACEHOLDER, enabled: true },
  { amount: 2_500, impact: PLACEHOLDER, enabled: true },
  { amount: 1_000, impact: 'Provides medical equipment for specialised surgeries', enabled: true },
  { amount: 500, impact: 'Provides medical supplies for critical surgeries', enabled: true },
  { amount: 250, impact: 'Provides surgical tools and equipment for operations', enabled: true },
  { amount: 100, impact: 'Provides essential medications', enabled: true },
  { amount: 50, impact: PLACEHOLDER, enabled: true },
  { amount: 25, impact: PLACEHOLDER, enabled: true },
];

export const IMPACT_MESSAGES: Omit<ImpactMessage, 'id'>[] = [
  { amount: 100, frequency: 'one-off', text: 'Provides essential medications' },
  { amount: 250, frequency: 'one-off', text: 'Provides surgical tools and equipment for operations' },
  { amount: 500, frequency: 'one-off', text: 'Provides medical supplies for critical surgeries' },
  { amount: 1_000, frequency: 'one-off', text: 'Provides medical equipment for specialised surgeries' },
  { amount: 20, frequency: 'monthly', text: 'Supplies continuous surgical products' },
  { amount: 50, frequency: 'monthly', text: 'Supplies continuous medications' },
  { amount: 100, frequency: 'monthly', text: 'Supports ongoing delivery of surgical instruments' },
  { amount: 250, frequency: 'monthly', text: 'Provides regular specialised medical supplies' },
];

export const MILESTONES: Omit<Milestone, 'id'>[] = [
  25_000, 50_000, 100_000, 150_000, 200_000, 250_000, 300_000,
].map((amount) => ({
  amount,
  enabled: true,
  headline: 'Alhamdulillah',
  message: 'Thank you for standing with Gaza.',
}));

export const SLIDES: LiveSlide[] = [
  { id: 'main', enabled: true, title: 'Gaza 3 Years On', subtitle: 'Help us continue lifesaving medical support in Gaza.' },
  { id: 'impact', enabled: true, title: 'Your generosity saves lives', subtitle: 'Specialised medical missions and urgently needed medical supplies for the people of Gaza.' },
  { id: 'levels', enabled: true, title: 'Stand with Gaza tonight', subtitle: 'Every gift helps carry medical care to those who need it most.' },
  { id: 'donors', enabled: true, title: 'With gratitude', subtitle: 'Pledges tonight' },
  { id: 'qr', enabled: true, title: 'Scan to pledge for lifesaving medical care in Gaza.', subtitle: 'Pledge now' },
  { id: 'thankyou', enabled: true, title: 'Jazakum Allahu Khairan', subtitle: 'Thank you for helping provide lifesaving medical support.' },
  { id: 'milestone', enabled: true, title: 'Jazakum Allahu Khairan', subtitle: 'Thank you for standing with Gaza.' },
];

export const DISPLAY: DisplayOptions = {
  celebration: 'standard',
  showAmounts: true,
  showImpactOnGift: true,
  recognitionThreshold: 5_000,
  goldThreshold: 5_000,
  cornerQr: true,
  calmMotion: false,
  appealPrompt: 'Who will help us reach {amount}?',
  adminQuote: '',
  adminQuoteSource: '',
};

/** Keys that change the slide from the operator dashboard / live display (Alt+Shift+n). */
export const SLIDE_ORDER: LiveSlide['id'][] = ['main', 'impact', 'levels', 'donors', 'qr', 'thankyou', 'milestone'];

export const SLIDE_LABELS: Record<LiveSlide['id'], string> = {
  main: 'Main fundraising',
  impact: 'Impact',
  levels: 'Giving levels',
  donors: 'Pledge wall',
  qr: 'QR code',
  thankyou: 'Thank you',
  milestone: 'Milestone',
};
