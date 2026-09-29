import type { RegionCode } from '../types/index.ts';

/**
 * Regions the campaign tours. Only the region → default city mapping lives
 * here; venues, dates and targets are event data edited in Settings.
 */
export const REGIONS: { code: RegionCode; label: string; defaultCity: string }[] = [
  { code: 'VIC', label: 'Victoria', defaultCity: 'Melbourne' },
  { code: 'NSW', label: 'New South Wales', defaultCity: 'Sydney' },
  { code: 'QLD', label: 'Queensland', defaultCity: 'Brisbane' },
  { code: 'WA', label: 'Western Australia', defaultCity: 'Perth' },
  { code: 'SA', label: 'South Australia', defaultCity: 'Adelaide' },
  { code: 'ACT', label: 'Australian Capital Territory', defaultCity: 'Canberra' },
];

export function regionLabel(code: RegionCode): string {
  return REGIONS.find((r) => r.code === code)?.label ?? code;
}
