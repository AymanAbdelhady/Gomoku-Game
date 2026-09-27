import type { Donation, DonorAccount, DonorSession, FundraisingEvent, Recognition } from '../types/index.ts';

/**
 * Rules for guests joining and pledging from their phones. Pure and shared by
 * the browser (same-browser mode) and the sync server, so a phone can never
 * bypass them by talking to the server directly.
 */

export interface JoinInput {
  code: string;
  name: string;
  recognition: Recognition;
  mobile: string;
  email: string;
  consent: boolean;
}

export type JoinResult = { ok: true; session: DonorSession } | { ok: false; error: string };
export type PledgeResult = { ok: true; status: 'approved' | 'pending'; pledge: Donation } | { ok: false; error: string };

/** Letters (any script), spaces and a little punctuation; max 40 characters. */
export function sanitiseName(input: string): string {
  return input
    .normalize('NFC')
    .replace(/[^\p{L}\p{M}\s&'.-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
}

export function normaliseMobile(input: string): string {
  return input.replace(/[^\d+]/g, '');
}

export function validateJoin(event: FundraisingEvent | undefined, input: JoinInput): string | null {
  if (!event) return 'This event is not open for pledges right now.';
  if (!event.pledging.enabled) return 'Pledging from phones is not open for this event.';
  if (input.code.trim() !== event.pledging.code) return 'That event code doesn’t match. Check the code on the big screen.';
  const name = sanitiseName(input.name);
  if (input.recognition !== 'anonymous' && name.length < 2) return 'Please enter your first name.';
  const mobile = normaliseMobile(input.mobile);
  const email = input.email.trim();
  const mobileOk = /^\+?\d{8,15}$/.test(mobile);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 120;
  if (!mobileOk && !emailOk) return 'Please enter a mobile number or email so we can help you complete your pledge.';
  if (!input.consent) return 'Please agree to be contacted about your pledge.';
  return null;
}

export function makeAccount(event: FundraisingEvent, input: JoinInput, id: string, at: number): DonorAccount {
  const name = sanitiseName(input.name);
  return {
    id,
    eventId: event.id,
    name,
    recognition: input.recognition === 'anonymous' || !name ? 'anonymous' : input.recognition,
    mobile: normaliseMobile(input.mobile),
    email: input.email.trim().toLowerCase(),
    consent: input.consent,
    createdAt: at,
  };
}

export function pledgeError(event: FundraisingEvent | undefined, account: DonorAccount | undefined, amount: number, levelId?: string): string | null {
  if (!event || !account || account.eventId !== event.id) return 'Your session has ended — please join again.';
  if (!event.pledging.enabled) return 'Pledging is closed for now.';
  if (event.status !== 'live') return 'Pledges are paused for a moment — please try again shortly.';
  if (!Number.isFinite(amount) || amount < 1) return 'Please choose an amount.';
  if (amount > event.pledging.maxAmount) return `For pledges above $${event.pledging.maxAmount.toLocaleString('en-AU')}, please speak with our team.`;
  if (levelId && !event.givingLevels.some((l) => l.id === levelId)) return 'That appeal has ended.';
  return null;
}

export function makePledge(event: FundraisingEvent, account: DonorAccount, amount: number, id: string, at: number, levelId?: string): Donation {
  const level = levelId ? event.givingLevels.find((l) => l.id === levelId && l.amount === amount) : undefined;
  const anonymous = account.recognition === 'anonymous' || !account.name;
  return {
    id,
    eventId: event.id,
    donor: { name: anonymous ? '' : account.name, recognition: anonymous ? 'anonymous' : account.recognition },
    amount: Math.round(amount * 100) / 100,
    anonymous,
    nameHidden: false,
    timestamp: at,
    source: 'app',
    viaPhone: true,
    donorId: account.id,
    ...(level ? { levelId: level.id } : {}),
  };
}

export function toSession(account: DonorAccount, token: string): DonorSession {
  return { donorId: account.id, token, eventId: account.eventId, name: account.name, recognition: account.recognition };
}

/** Public copy of the state: pledges awaiting approval are withheld from displays and phones. */
export function redactPending<T extends { events: Record<string, FundraisingEvent> }>(state: T): T {
  const events: Record<string, FundraisingEvent> = {};
  for (const [id, e] of Object.entries(state.events)) events[id] = e.pendingPledges.length ? { ...e, pendingPledges: [] } : e;
  return { ...state, events };
}
