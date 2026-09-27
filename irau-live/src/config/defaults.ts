import type { AppState, FundraisingEvent, RegionCode } from '../types/index.ts';
import { BRAND, CAMPAIGN, DISPLAY, GIVING_LEVELS, IMPACT_MESSAGES, MILESTONES, SLIDES } from './campaign.ts';
import { REGIONS } from './locations.ts';
import { uid } from '../utils/id.ts';

export const SCHEMA_VERSION = 1;

/** Builds a fresh event for a region from the campaign template. */
export function createEvent(region: RegionCode, overrides: Partial<FundraisingEvent> = {}): FundraisingEvent {
  const regionInfo = REGIONS.find((r) => r.code === region);
  return {
    id: uid('evt'),
    name: CAMPAIGN.name,
    organisation: CAMPAIGN.organisation,
    region,
    city: regionInfo?.defaultCity ?? '',
    venue: '',
    date: '',
    tagline: CAMPAIGN.tagline,
    description: CAMPAIGN.description,
    campaignStatement: CAMPAIGN.campaignStatement,
    partnerLine: CAMPAIGN.partnerLine,
    status: 'live',
    target: CAMPAIGN.target,
    openingBalance: 0,
    openingDonorCount: 0,
    donationUrl: CAMPAIGN.donationUrl,
    qrUrl: '',
    qrLabel: CAMPAIGN.qrLabel,
    givingLevels: GIVING_LEVELS.map((l) => ({ ...l, id: uid('lvl') })),
    milestones: MILESTONES.map((m) => ({ ...m, id: uid('ms') })),
    impactMessages: IMPACT_MESSAGES.map((m) => ({ ...m, id: uid('imp') })),
    slides: SLIDES.map((s) => ({ ...s })),
    brand: { ...BRAND },
    display: { ...DISPLAY },
    pledging: { enabled: true, code: pledgeCode(), approval: 'auto', maxAmount: 100_000, publicUrl: '' },
    joinedCount: 0,
    pendingPledges: [],
    donations: [],
    live: { slide: 'main', activeLevelId: null, celebratedMilestoneIds: [], overlays: [] },
    demo: { running: false, autoStage: true, intervalMs: 3200, tick: 0 },
    updatedAt: Date.now(),
    ...overrides,
  };
}

/** Four-digit code guests enter on their phones to join the pledge appeal. */
export function pledgeCode(): string {
  const n = typeof crypto !== 'undefined' && 'getRandomValues' in crypto ? crypto.getRandomValues(new Uint32Array(1))[0] : Math.floor(Math.random() * 2 ** 32);
  return String(1000 + (n % 9000));
}

/** One event per touring region, all sharing the campaign template. */
export function createInitialState(): AppState {
  const events = REGIONS.map((r) => createEvent(r.code));
  return {
    schemaVersion: SCHEMA_VERSION,
    activeEventId: events[0].id,
    events: Object.fromEntries(events.map((e) => [e.id, e])),
    rev: 0,
  };
}
