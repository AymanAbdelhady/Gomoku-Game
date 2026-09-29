import type { AppState, Donation, EventTotals, FundraisingEvent, GivingFrequency, GivingLevel, Milestone } from '../types/index.ts';
import { publicText } from '../utils/content.ts';

export function getActiveEvent(state: AppState): FundraisingEvent {
  return state.events[state.activeEventId] ?? Object.values(state.events)[0];
}

export function getTotals(event: FundraisingEvent): EventTotals {
  const donated = event.donations.reduce((sum, d) => sum + d.amount, 0);
  const raised = event.openingBalance + donated;
  const target = Math.max(1, event.target);
  return {
    raised,
    donorCount: event.openingDonorCount + event.donations.length,
    target: event.target,
    progress: raised / target,
    remaining: Math.max(0, event.target - raised),
  };
}

/** Newest first. */
export function recentDonations(event: FundraisingEvent, limit = 50): Donation[] {
  return event.donations.slice(-limit).reverse();
}

export function getActiveLevel(event: FundraisingEvent): GivingLevel | null {
  return event.givingLevels.find((l) => l.id === event.live.activeLevelId) ?? null;
}

export function enabledLevels(event: FundraisingEvent): GivingLevel[] {
  return event.givingLevels.filter((l) => l.enabled).sort((a, b) => b.amount - a.amount);
}

export function enabledMilestones(event: FundraisingEvent): Milestone[] {
  return event.milestones.filter((m) => m.enabled && m.amount > 0).sort((a, b) => a.amount - b.amount);
}

/** Highest enabled milestone at or below the current total. */
export function lastReachedMilestone(event: FundraisingEvent): Milestone | null {
  const { raised } = getTotals(event);
  const reached = enabledMilestones(event).filter((m) => m.amount <= raised);
  return reached[reached.length - 1] ?? null;
}

export function nextMilestone(event: FundraisingEvent): Milestone | null {
  const { raised } = getTotals(event);
  return enabledMilestones(event).find((m) => m.amount > raised) ?? null;
}

/**
 * Confirmed (non-placeholder) impact line for an amount, or ''.
 * Looks at impact statements first, then the giving level's own line.
 */
export function impactFor(event: FundraisingEvent, amount: number, frequency: GivingFrequency = 'one-off'): string {
  const msg = event.impactMessages.find((m) => m.amount === amount && m.frequency === frequency);
  const fromMessage = publicText(msg?.text);
  if (fromMessage) return fromMessage;
  if (frequency === 'one-off') {
    const level = event.givingLevels.find((l) => l.amount === amount);
    return publicText(level?.impact);
  }
  return '';
}

export function giftsAtLevel(event: FundraisingEvent, levelId: string): Donation[] {
  return event.donations.filter((d) => d.levelId === levelId);
}

export function qrTarget(event: FundraisingEvent): string {
  return (event.qrUrl || event.donationUrl).trim();
}
