import { useEffect } from 'react';
import type { Appearance, BrandColours } from '../types';

const VALID = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const SERIF = "'Fraunces Variable', 'Iowan Old Style', Georgia, serif";
const SANS = "'Inter Variable', ui-sans-serif, system-ui, sans-serif";

/**
 * Pushes the event's brand colours, background and heading font into the CSS
 * custom properties every surface uses, so Settings changes apply everywhere
 * (live screen, operator screens and guest phones) immediately.
 */
export function useBrandColours(brand: BrandColours, appearance?: Appearance) {
  useEffect(() => {
    const root = document.documentElement.style;
    const map: [keyof BrandColours, string][] = [
      ['primary', '--color-brand'],
      ['navy', '--color-navy'],
      ['teal', '--color-teal'],
      ['gold', '--color-gold'],
      ['background', '--color-ink'],
    ];
    for (const [key, cssVar] of map) {
      if (VALID.test(brand[key] ?? '')) root.setProperty(cssVar, brand[key]);
    }
    if (appearance) root.setProperty('--font-display', appearance.headingFont === 'sans' ? SANS : SERIF);
  }, [brand, appearance]);
}

/** WCAG relative luminance of a hex colour (0 = black, 1 = white). */
export function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio of white text on the given background (WCAG; 4.5+ is comfortable, 7+ is ideal for a projector). */
export function whiteContrast(hex: string): number {
  return 1.05 / (luminance(hex) + 0.05);
}
