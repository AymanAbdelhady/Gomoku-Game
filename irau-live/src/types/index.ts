/**
 * Domain model for the live fundraising platform.
 *
 * These types are shared by the browser app and the optional realtime sync
 * server (server/index.ts), so this file must stay free of runtime code.
 */

/** Australian states/territories where the campaign is presented. */
export type RegionCode = 'VIC' | 'WA' | 'SA' | 'NSW' | 'ACT' | 'QLD';

export type EventStatus = 'live' | 'paused';

/** How a pledger wishes to be recognised on screen. */
export type Recognition = 'name' | 'family' | 'anonymous';

/**
 * Where a pledge came from: called from the stage and entered by the
 * operator, made by a guest on their phone, or simulated in Demo Mode.
 * ('online' is reserved for a future payment-platform webhook.)
 */
export type DonationSource = 'stage' | 'app' | 'online' | 'demo';

export type GivingFrequency = 'one-off' | 'monthly';

/**
 * The public face of a pledger: a display name and recognition preference.
 * Contact details for pledge follow-up live in a separate, operator-only
 * store (see DonorAccount) and are never part of the shared event state.
 */
export interface Donor {
  /** Name as the donor wishes it to be read, e.g. "Ahmed" or "Sarah". */
  name: string;
  recognition: Recognition;
}

/**
 * A pledge. (The type keeps its original name; everything user-facing calls
 * it a pledge.) Pledges are promises to give, completed later through the
 * official donation page — this system never takes payment.
 */
export interface Donation {
  id: string;
  eventId: string;
  donor: Donor;
  amount: number;
  /** Mirrors donor.recognition === 'anonymous'; kept for easy querying/export. */
  anonymous: boolean;
  /** Admin moderation: hide the name on every public surface without deleting the gift. */
  nameHidden: boolean;
  timestamp: number;
  source: DonationSource;
  /** Giving level that was active when the gift was taken, if any. */
  levelId?: string;
  /** Set for pledges made from a phone: links to the private DonorAccount. */
  donorId?: string;
  /** Made on a guest's phone (real, or simulated in Demo Mode). */
  viaPhone?: boolean;
}

export type Pledge = Donation;

/** How phone pledging works for an event. */
export interface PledgeSettings {
  enabled: boolean;
  /** Short code shown on screen; guests enter it (or scan it) to join. */
  code: string;
  /** 'auto': phone pledges go straight on screen. 'manual': an operator approves each one. */
  approval: 'auto' | 'manual';
  /** Largest single pledge accepted from a phone. */
  maxAmount: number;
  /** Address phones use to reach this app (for the QR code). Blank = detect automatically. */
  publicUrl: string;
}

/**
 * PRIVATE — a guest who joined from their phone. Held only by the sync
 * server (server/data/donors.json) or, in same-browser mode, this browser.
 * Never included in AppState, never sent to displays.
 */
export interface DonorAccount {
  id: string;
  eventId: string;
  name: string;
  recognition: Recognition;
  mobile: string;
  email: string;
  consent: boolean;
  createdAt: number;
}

/** What a phone keeps after joining. The token proves it is the same guest. */
export interface DonorSession {
  donorId: string;
  token: string;
  eventId: string;
  name: string;
  recognition: Recognition;
}

export interface GivingLevel {
  id: string;
  amount: number;
  /** Optional impact line. Leave as a [PLACEHOLDER] until confirmed — placeholders never show publicly. */
  impact: string;
  enabled: boolean;
}

export interface Milestone {
  id: string;
  amount: number;
  enabled: boolean;
  /** Large word shown above the amount, e.g. "Alhamdulillah". */
  headline: string;
  message: string;
}

export interface ImpactMessage {
  id: string;
  /** When set, the message is linked to gifts of this exact amount. */
  amount?: number;
  frequency: GivingFrequency;
  text: string;
}

export type SlideId =
  | 'main'
  | 'impact'
  | 'levels'
  | 'donors'
  | 'qr'
  | 'thankyou'
  | 'milestone'
  /** Not in the slide list: shown automatically while a giving level is active. */
  | 'appeal';

export interface LiveSlide {
  id: Exclude<SlideId, 'appeal'>;
  enabled: boolean;
  title: string;
  subtitle: string;
}

export interface BrandColours {
  primary: string;
  navy: string;
  teal: string;
  gold: string;
}

/** How big gift celebrations are on the live screen. */
export type CelebrationLevel = 'subtle' | 'standard' | 'festive';

export interface DisplayOptions {
  celebration: CelebrationLevel;
  /** Show gift amounts next to names in the feed and donor wall. */
  showAmounts: boolean;
  /** Show the matching impact line under the total when a gift arrives. */
  showImpactOnGift: boolean;
  /** Gifts at or above this amount default to an on-screen thank-you. 0 disables. */
  recognitionThreshold: number;
  /** Gifts at or above this amount receive the gold treatment. */
  goldThreshold: number;
  /** Small QR code in the corner of the main slide. */
  cornerQr: boolean;
  /** Force minimal motion on the display regardless of OS settings. */
  calmMotion: boolean;
  /** Template for the appeal prompt. `{amount}` is replaced with the level. */
  appealPrompt: string;
  /** Optional verse/quotation — must be supplied by the administrator. Never auto-generated. */
  adminQuote: string;
  adminQuoteSource: string;
}

export interface Overlay {
  id: string;
  kind: 'milestone' | 'thankyou';
  createdAt: number;
  amount: number;
  headline: string;
  message: string;
  /** Thank-you overlays: the already-privacy-filtered public name. */
  name?: string;
}

export interface DemoState {
  running: boolean;
  /** Also drive appeals and slide changes, not only donations. */
  autoStage: boolean;
  intervalMs: number;
  tick: number;
}

export interface LiveState {
  slide: SlideId;
  activeLevelId: string | null;
  celebratedMilestoneIds: string[];
  overlays: Overlay[];
}

export interface FundraisingEvent {
  id: string;
  name: string;
  organisation: string;
  region: RegionCode;
  city: string;
  venue: string;
  /** ISO date (yyyy-mm-dd). */
  date: string;
  tagline: string;
  description: string;
  campaignStatement: string;
  partnerLine: string;
  status: EventStatus;

  target: number;
  /** Funds raised outside this system (pre-event, cash, online). Added to donations. */
  openingBalance: number;
  openingDonorCount: number;

  /** Where "Donate now" goes. May contain {amount} and {frequency} tokens. */
  donationUrl: string;
  /** Optional different URL encoded in the QR code (e.g. with tracking). Falls back to donationUrl. */
  qrUrl: string;
  qrLabel: string;

  givingLevels: GivingLevel[];
  milestones: Milestone[];
  impactMessages: ImpactMessage[];
  slides: LiveSlide[];
  brand: BrandColours;
  display: DisplayOptions;

  pledging: PledgeSettings;
  /** Number of guests who have joined from their phones (a count only). */
  joinedCount: number;
  /** Phone pledges waiting for operator approval (approval: 'manual'). */
  pendingPledges: Donation[];
  donations: Donation[];
  live: LiveState;
  demo: DemoState;
  updatedAt: number;
}

export interface AppState {
  schemaVersion: number;
  activeEventId: string;
  events: Record<string, FundraisingEvent>;
  /** Monotonic revision, incremented by every applied action. */
  rev: number;
}

/** Derived, read-only numbers for a given event. */
export interface EventTotals {
  raised: number;
  donorCount: number;
  target: number;
  progress: number;
  remaining: number;
}
