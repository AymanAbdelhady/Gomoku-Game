import type { Donation } from '../types/index.ts';

/** Content still awaiting confirmation is wrapped in [SQUARE BRACKETS]. */
export function isPlaceholder(text: string | undefined | null): boolean {
  if (!text) return true;
  const t = text.trim();
  return t.length === 0 || (t.startsWith('[') && t.endsWith(']'));
}

/** Safe for public surfaces: returns '' for placeholders so they never reach the audience. */
export function publicText(text: string | undefined | null): string {
  return isPlaceholder(text) ? '' : (text ?? '').trim();
}

/**
 * The only way a donor name should be rendered publicly.
 * Honours anonymity, admin moderation and the "& Family" preference.
 */
export function publicDonorName(d: Pick<Donation, 'donor' | 'anonymous' | 'nameHidden'>): string {
  const name = d.donor.name.trim();
  if (d.anonymous || d.nameHidden || d.donor.recognition === 'anonymous' || !name) return 'Anonymous';
  if (d.donor.recognition === 'family' && !/family$/i.test(name)) return `${name} & Family`;
  return name;
}

/** Fills `{amount}` / `{frequency}` tokens in a donation URL template. */
export function buildDonationUrl(template: string, amount?: number, frequency?: string): string {
  let url = template.trim();
  const hasTokens = /\{(amount|frequency)\}/.test(url);
  if (!hasTokens) return url;
  url = url.replace(/\{amount\}/g, amount ? String(amount) : '').replace(/\{frequency\}/g, frequency ?? '');
  return url;
}
