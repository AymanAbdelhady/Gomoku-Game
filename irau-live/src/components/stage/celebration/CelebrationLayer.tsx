import { useEffect, useRef } from 'react';
import type { Gift } from '../stageTypes';
import type { CelebrationLevel } from '../../../types';
import { CelebrationEngine, type Point } from './engine';
import { giftTier, INTENSITY } from './tiers';
import { STAGE_H, STAGE_W } from '../ScaledStage';

/** Reads a live CSS colour token so celebrations follow the event's brand settings. */
function token(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return /^#[0-9a-f]{3,6}$/i.test(v) ? v : fallback;
}

/**
 * Choreographs each new gift across the stage:
 *
 *   1. a comet of light leaves the gift in the feed (or the total)
 *   2. it arcs into the leading edge of the progress bar as the bar surges
 *   3. the bar bursts with stars, a shock-wave ring and sparkles along the new segment
 *   4. major gifts add golden bursts across the sky
 *
 * Elements opt in with data attributes: `feed-top`, `total`, `bar-head`, `focus`.
 */
export function CelebrationLayer({ gift, goldThreshold, level, enabled }: { gift: Gift | null; goldThreshold: number; level: CelebrationLevel; enabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CelebrationEngine | null>(null);
  const barTail = useRef<Point | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new CelebrationEngine(canvasRef.current);
    engineRef.current = engine;
    return () => engine.destroy();
  }, []);

  // Remember where the bar ended before this gift, to sparkle the new segment.
  useEffect(() => {
    const root = canvasRef.current?.parentElement;
    const head = root ? locate(root, 'bar-head') : null;
    if (head) barTail.current = head;
  });

  useEffect(() => {
    const engine = engineRef.current;
    const root = canvasRef.current?.parentElement;
    if (!gift || !engine || !root || !enabled) return;

    const k = INTENSITY[level];
    const tier = giftTier(gift.donation.amount, goldThreshold);
    const blue = token('--color-brand', '#0778d4');
    const teal = token('--color-teal', '#66b3bc');
    const gold = token('--color-gold', '#c9a45c');
    const cool = ['#ffffff', teal, blue, '#bfe4ff'];
    const warm = ['#ffffff', gold, '#ffe3a3', gold];
    const palette = tier === 'major' ? warm : tier === 'large' ? ['#ffffff', teal, gold, '#bfe4ff'] : cool;
    const n = (x: number) => Math.max(4, Math.round(x * k));

    const tail = barTail.current;
    const source = locate(root, 'feed-top') ?? locate(root, 'total') ?? { x: STAGE_W / 2, y: 220 };
    const target = () => locate(root, 'bar-head') ?? { x: STAGE_W / 2, y: STAGE_H - 120 };

    engine.comet(source, target, {
      duration: tier === 'small' ? 800 : 1000,
      color: tier === 'major' ? gold : teal,
      size: tier === 'small' ? 7 : tier === 'medium' ? 9 : 12,
      palette,
      onArrive: (at) => {
        engine.ring(at, '#ffffff', tier === 'small' ? 70 : tier === 'medium' ? 110 : 170, 900, 3);
        if (tier !== 'small') engine.ring(at, tier === 'major' ? gold : teal, tier === 'major' ? 280 : 200, 1300, 2);
        engine.burst(at, {
          count: n({ small: 16, medium: 30, large: 52, major: 80 }[tier]),
          palette,
          speed: { small: 7, medium: 9, large: 12, major: 15 }[tier],
          size: tier === 'major' ? 10 : 8,
          gravity: 0.14,
          life: 1500,
        });
        if (tail && tier !== 'small' && at.x - tail.x > 6) {
          engine.shimmer(tail, at, n(tier === 'medium' ? 18 : 36), palette);
        }
        const focus = locate(root, 'focus');
        if (focus) engine.burst(focus, { count: n(tier === 'major' ? 70 : 34), palette, speed: 13, size: 10, gravity: 0.1 });
        if (tier === 'major') {
          const total = locate(root, 'total');
          if (total) engine.ring(total, gold, 420, 1600, 2);
          fireworks(engine, n(3), warm);
        } else if (tier === 'large') {
          fireworks(engine, Math.max(1, Math.round(1 * k)), palette);
        }
      },
    });
  }, [gift, goldThreshold, level, enabled]);

  return <canvas ref={canvasRef} width={STAGE_W} height={STAGE_H} className="motion-decor pointer-events-none absolute inset-0 z-30" aria-hidden="true" />;
}

function fireworks(engine: CelebrationEngine, count: number, palette: string[]) {
  for (let i = 0; i < count; i++) {
    engine.later(250 + i * 380, () => {
      const at = { x: 300 + Math.random() * (STAGE_W - 600), y: 200 + Math.random() * 320 };
      engine.ring(at, palette[1], 120, 900, 2);
      engine.burst(at, { count: 44, palette, speed: 11, size: 9, gravity: 0.09, life: 1700 });
    });
  }
}

/** Centre of a `[data-celebrate=name]` element, in 1920×1080 stage coordinates. */
function locate(root: HTMLElement, name: string): Point | null {
  const el = root.querySelector<HTMLElement>(`[data-celebrate="${name}"]`);
  if (!el) return null;
  const stage = root.getBoundingClientRect();
  if (!stage.width) return null;
  const scale = stage.width / STAGE_W;
  const r = el.getBoundingClientRect();
  return { x: (r.left + r.width / 2 - stage.left) / scale, y: (r.top + r.height / 2 - stage.top) / scale };
}
