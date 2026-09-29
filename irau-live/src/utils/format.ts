const whole = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0, minimumFractionDigits: 0 });
const number = new Intl.NumberFormat('en-AU');

/** $247,850 — whole dollars, AU formatting, no "A$" prefix. */
export function money(value: number): string {
  return whole.format(Math.round(value)).replace('A$', '$');
}

/** $250K / $1.2M — for tick labels and tight spaces. */
export function moneyCompact(value: number): string {
  if (value >= 1_000_000) return `$${trim(value / 1_000_000)}M`;
  if (value >= 1_000) return `$${trim(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

function trim(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

export function formatNumber(value: number): string {
  return number.format(Math.round(value));
}

export function percent(progress: number, digits = 1): string {
  const p = progress * 100;
  return `${p >= 100 || digits === 0 ? Math.floor(p) : p.toFixed(digits)}%`;
}

/**
 * Forgiving amount parser for fast stage entry:
 * "5000", "$5,000", "5k", "2.5k", "1m" → number (or null).
 */
export function parseAmount(input: string): number | null {
  const s = input.trim().toLowerCase().replace(/[$,\s]/g, '');
  if (!s) return null;
  const match = /^(\d+(?:\.\d+)?)(k|m)?$/.exec(s);
  if (!match) return null;
  let n = parseFloat(match[1]);
  if (match[2] === 'k') n *= 1_000;
  if (match[2] === 'm') n *= 1_000_000;
  n = Math.round(n * 100) / 100;
  return n > 0 && n < 100_000_000 ? n : null;
}

export function formatEventDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
