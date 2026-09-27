import { useEffect, useRef } from 'react';
import { CelebrationEngine } from '../stage/celebration/engine';
import { usePrefersReducedMotion } from '../../utils/hooks';

/** A burst of stars on the guest's phone when their pledge lands. */
export function PhoneCelebration({ trigger, gold }: { trigger: string; gold: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || reduced) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const engine = new CelebrationEngine(canvas);
    const css = getComputedStyle(document.documentElement);
    const g = (n: string, f: string) => css.getPropertyValue(n).trim() || f;
    const palette = gold ? ['#ffffff', g('--color-gold', '#c9a45c'), '#ffe3a3'] : ['#ffffff', g('--color-teal', '#66b3bc'), g('--color-brand', '#0778d4'), '#bfe4ff'];
    const w = canvas.width;
    const h = canvas.height;
    engine.ring({ x: w / 2, y: h * 0.32 }, palette[1], Math.min(w, h) * 0.6, 1200, 3);
    engine.burst({ x: w / 2, y: h * 0.32 }, { count: 70, palette, speed: 13, size: 9, gravity: 0.16, life: 1800 });
    engine.later(350, () => engine.burst({ x: w * 0.2, y: h * 0.2 }, { count: 36, palette, speed: 9, size: 7, gravity: 0.12 }));
    engine.later(600, () => engine.burst({ x: w * 0.8, y: h * 0.25 }, { count: 36, palette, speed: 9, size: 7, gravity: 0.12 }));
    return () => engine.destroy();
  }, [trigger, gold, reduced]);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-50 h-full w-full" aria-hidden="true" />;
}
