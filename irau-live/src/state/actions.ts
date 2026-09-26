import type { AppState, Donation, EventStatus, FundraisingEvent, SlideId } from '../types/index.ts';

/**
 * Every change to event data is one of these serialisable actions.
 *
 * Actions carry their own ids/timestamps/seeds so the reducer stays pure: the
 * same action produces the same result in every tab, on the sync server, or
 * in a future Supabase/Firebase function.
 */
export type Action =
  | { type: 'donation/add'; donation: Donation; recognise?: boolean }
  | { type: 'donation/update'; eventId: string; id: string; patch: Partial<Pick<Donation, 'donor' | 'anonymous' | 'nameHidden' | 'amount'>> }
  | { type: 'donation/remove'; eventId: string; id: string }
  | { type: 'donation/recognise'; eventId: string; id: string; at: number }
  | { type: 'live/slide'; eventId: string; slide: SlideId }
  | { type: 'live/level'; eventId: string; levelId: string | null }
  | { type: 'live/milestone'; eventId: string; milestoneId: string; at: number }
  | { type: 'live/clearOverlays'; eventId: string }
  | { type: 'event/status'; eventId: string; status: EventStatus }
  | { type: 'event/update'; eventId: string; patch: Partial<Omit<FundraisingEvent, 'id' | 'donations' | 'live' | 'demo'>> }
  | { type: 'event/setRaised'; eventId: string; raised: number }
  | { type: 'event/create'; event: FundraisingEvent; activate?: boolean }
  | { type: 'event/delete'; eventId: string }
  | { type: 'event/activate'; eventId: string }
  | { type: 'event/resetData'; eventId: string }
  | { type: 'demo/start'; eventId: string; at: number; seed: number; autoStage: boolean; intervalMs: number }
  | { type: 'demo/stop'; eventId: string }
  | { type: 'demo/configure'; eventId: string; autoStage?: boolean; intervalMs?: number }
  | { type: 'demo/tick'; eventId: string; at: number; seed: number }
  | { type: 'demo/clear'; eventId: string }
  | { type: 'state/replace'; state: AppState };

