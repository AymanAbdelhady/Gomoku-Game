import type { CelebrationLevel } from '../../../types';

export type GiftTier = 'small' | 'medium' | 'large' | 'major';

/** Bigger gifts get a bigger (but always proportionate) moment. */
export function giftTier(amount: number, goldThreshold: number): GiftTier {
  if (goldThreshold > 0 && amount >= goldThreshold) return 'major';
  if (amount >= 1_000) return 'large';
  if (amount >= 250) return 'medium';
  return 'small';
}

export const INTENSITY: Record<CelebrationLevel, number> = { subtle: 0.5, standard: 1, festive: 1.7 };
