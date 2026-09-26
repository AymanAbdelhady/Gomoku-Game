import { useEffect } from 'react';
import type { BrandColours } from '../types';

const VALID = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Pushes the event's brand colours into the CSS custom properties Tailwind uses. */
export function useBrandColours(brand: BrandColours) {
  useEffect(() => {
    const root = document.documentElement.style;
    const map: [keyof BrandColours, string][] = [
      ['primary', '--color-brand'],
      ['navy', '--color-navy'],
      ['teal', '--color-teal'],
      ['gold', '--color-gold'],
    ];
    for (const [key, cssVar] of map) {
      if (VALID.test(brand[key])) root.setProperty(cssVar, brand[key]);
    }
  }, [brand]);
}
