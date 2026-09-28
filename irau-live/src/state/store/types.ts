import type { AppState, DonorAccount, DonorSession } from '../../types/index.ts';
import type { Action } from '../actions.ts';
import type { JoinInput, JoinResult, PledgeResult } from '../pledging.ts';

export type SyncMode = 'local' | 'server';

export interface SyncStatus {
  mode: SyncMode;
  /** Whether this device can currently reach the realtime channel. */
  online: boolean;
  /** Operator actions not yet confirmed by the sync server (server mode only). */
  pending: number;
  /** Increments each time the connection comes back after a drop. */
  reconnects: number;
  /** Operator authorisation for write actions (server mode). */
  authorised: boolean;
  /** Human-readable last error, if any. */
  error: string | null;
}

/**
 * Anything that can hold and share event state.
 *
 * To move to Supabase/Firebase/Ably etc., implement this interface (see
 * serverStore.ts for the pattern: optimistic local apply + outbox + remote
 * snapshots) and return it from createStore(). No component needs to change.
 */
export interface EventStore {
  getState(): AppState;
  subscribe(listener: () => void): () => void;
  dispatch(action: Action): void;
  getStatus(): SyncStatus;
  subscribeStatus(listener: () => void): () => void;
  /** Validates an operator passcode. Resolves true when write access is granted. */
  authorise(passcode: string): Promise<boolean>;
  /** Whether this device should run the demo clock (server mode: the server does). */
  runsDemoLocally: boolean;

  // ── Guest pledging (public) ──
  /** A guest joins the active event from their phone. */
  joinAsDonor(input: JoinInput): Promise<JoinResult>;
  /** A joined guest pledges an amount (optionally to the appeal level on screen). */
  submitPledge(session: DonorSession, amount: number, levelId?: string): Promise<PledgeResult>;

  // ── Operator only ──
  /** Private pledger contact list for follow-up. */
  listDonors(): Promise<DonorAccount[]>;
  /** Suggested address for phones to reach this app (e.g. the venue server's LAN address). */
  publicBaseUrl(): string | null;
  /** Stores a prepared image (data URL) and returns the URL to reference it by. */
  storeAsset(dataUrl: string): Promise<string>;
}
