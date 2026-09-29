import type { Donation, EventTotals, FundraisingEvent } from '../../types';

export interface Gift {
  donation: Donation;
  /** Unique per celebration (a gift can be re-announced). */
  key: string;
}

/** Everything a slide needs, computed once per render in <LiveStage>. */
export interface StageData {
  event: FundraisingEvent;
  totals: EventTotals;
  reduced: boolean;
  now: number;
  /** Most recent gift received while this screen was open. */
  gift: Gift | null;
  pulseKey: string | number;
  /** Pledges queued behind the one in the spotlight. */
  waiting: number;
}
