import type { Donation, FundraisingEvent, Recognition, SlideId } from '../types/index.ts';
import { mulberry32, pickWeighted } from '../utils/random.ts';

/**
 * DEMO MODE — simulated giving so the team can rehearse and present the
 * platform without a payment system. Every simulated gift is tagged
 * `source: 'demo'` and can be cleared in one click. Names are illustrative.
 */

const DEMO_NAMES: [string, Recognition][] = [
  ['Ahmed', 'name'], ['Fatima', 'name'], ['Sarah', 'family'], ['Yusuf', 'name'], ['Maryam', 'name'],
  ['Omar', 'family'], ['Aisha', 'name'], ['Ibrahim', 'name'], ['Khadija', 'name'], ['Hassan', 'family'],
  ['Zainab', 'name'], ['The Rahman Family', 'name'], ['Bilal', 'name'], ['Noor', 'name'], ['Amina', 'family'],
  ['Mustafa', 'name'], ['Hana', 'name'], ['Idris', 'name'], ['Layla', 'family'], ['Samir', 'name'],
];

const GIFT_WEIGHTS: [number, number][] = [
  [25, 6], [50, 10], [100, 16], [250, 16], [500, 14], [1_000, 12], [2_500, 5], [5_000, 3], [10_000, 1],
];

/** Stage script, in ticks. Only used when `autoStage` is on. */
const CYCLE = 36;
const SCRIPT: Record<number, SlideId | 'appeal-start' | 'appeal-end'> = {
  0: 'main',
  8: 'appeal-start',
  14: 'appeal-end',
  22: 'impact',
  25: 'main',
  30: 'qr',
  33: 'donors',
};
const APPEAL_PLEDGE_TICKS = new Set([9, 10, 12, 13]);

export interface DemoOutcome {
  donations: { donation: Donation; recognise: boolean }[];
  slide?: SlideId;
  levelId?: string | null;
  stop?: boolean;
  /** Simulated guests joining from their phones this tick. */
  joined?: number;
}

function demoDonor(rand: () => number): { name: string; recognition: Recognition } {
  if (rand() < 0.38) return { name: '', recognition: 'anonymous' };
  const [name, recognition] = DEMO_NAMES[Math.floor(rand() * DEMO_NAMES.length)];
  return { name, recognition };
}

function makeDonation(event: FundraisingEvent, id: string, amount: number, at: number, rand: () => number, levelId?: string): Donation {
  const donor = demoDonor(rand);
  return {
    id,
    eventId: event.id,
    donor,
    amount,
    anonymous: donor.recognition === 'anonymous',
    nameHidden: false,
    timestamp: at,
    source: 'demo',
    viaPhone: rand() < 0.55,
    ...(levelId ? { levelId } : {}),
  };
}

/** A believable history so the screen is never empty when a demo begins. */
export function demoHistory(event: FundraisingEvent, at: number, seed: number, raisedSoFar: number): Donation[] {
  const rand = mulberry32(seed);
  const goal = event.target * 0.28 - raisedSoFar;
  const out: Donation[] = [];
  let sum = 0;
  let i = 0;
  while (sum < goal && i < 400) {
    const amount = pickWeighted(rand, GIFT_WEIGHTS);
    out.push(makeDonation(event, `demo_${seed.toString(36)}_h${i}`, amount, 0, rand));
    sum += amount;
    i++;
  }
  // Spread over the last ~40 minutes, oldest first.
  const span = 40 * 60 * 1000;
  out.forEach((d, idx) => {
    d.timestamp = at - span + Math.round((span * (idx + 1)) / (out.length + 1));
  });
  return out;
}

export function demoTick(event: FundraisingEvent, at: number, seed: number, raised: number): DemoOutcome {
  const rand = mulberry32(seed);
  const t = event.demo.tick % CYCLE;
  const outcome: DemoOutcome = { donations: [] };
  const idBase = `demo_${seed.toString(36)}`;
  const recogniseAt = event.display.recognitionThreshold;

  if (raised >= event.target * 1.2) return { donations: [], stop: true };
  if (rand() < 0.35) outcome.joined = 1;

  if (event.demo.autoStage) {
    const cue = SCRIPT[t];
    if (cue === 'appeal-start') {
      const candidates = event.givingLevels.filter((l) => l.enabled && l.amount >= 1_000);
      const level = candidates[Math.floor(rand() * candidates.length)];
      if (level) {
        outcome.levelId = level.id;
        outcome.slide = 'appeal';
      }
    } else if (cue === 'appeal-end') {
      outcome.levelId = null;
      outcome.slide = 'main';
    } else if (cue) {
      outcome.slide = cue;
      if (cue === 'main') outcome.levelId = null;
    }

    const activeLevel = event.givingLevels.find((l) => l.id === event.live.activeLevelId);
    if (activeLevel && t > 8 && t < 14) {
      if (APPEAL_PLEDGE_TICKS.has(t) && rand() < 0.8) {
        const d = makeDonation(event, `${idBase}_p`, activeLevel.amount, at, rand, activeLevel.id);
        outcome.donations.push({ donation: d, recognise: recogniseAt > 0 && d.amount >= recogniseAt && rand() < 0.5 });
      }
      return outcome;
    }
  }

  if (rand() < 0.85) {
    const amount = pickWeighted(rand, GIFT_WEIGHTS);
    const d = makeDonation(event, `${idBase}_g`, amount, at, rand);
    outcome.donations.push({ donation: d, recognise: recogniseAt > 0 && amount >= recogniseAt && rand() < 0.6 });
  }
  return outcome;
}
