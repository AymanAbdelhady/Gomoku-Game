/**
 * Tiny particle engine for gift celebrations on the live stage.
 *
 * Draws on one canvas in stage coordinates (1920×1080). The animation loop
 * only runs while something is on screen, so an idle display costs nothing.
 * Particles are eight-point stars (the khatam motif used across the design),
 * soft dots and sparks, rather than generic confetti.
 */

export interface Point {
  x: number;
  y: number;
}

type Shape = 'star' | 'dot' | 'spark';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  life: number;
  maxLife: number;
  color: string;
  shape: Shape;
  gravity: number;
  drag: number;
  twinkle: number;
}

interface Ring {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
  width: number;
}

interface Comet {
  from: Point;
  ctrl: Point;
  to: () => Point;
  t: number;
  duration: number;
  color: string;
  size: number;
  palette: string[];
  onArrive: (at: Point) => void;
  last: Point;
}

export interface BurstOptions {
  count: number;
  palette: string[];
  speed?: number;
  spread?: number;
  /** Radians; default is a full circle. */
  angle?: number;
  gravity?: number;
  size?: number;
  life?: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

export class CelebrationEngine {
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private rings: Ring[] = [];
  private comets: Comet[] = [];
  private frame = 0;
  private lastTime = 0;
  private timers: number[] = [];

  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    this.timers.forEach((t) => window.clearTimeout(t));
    this.particles = [];
    this.rings = [];
    this.comets = [];
  }

  later(ms: number, fn: () => void) {
    this.timers.push(window.setTimeout(fn, ms));
  }

  /** Radial burst of stars and sparks. */
  burst(at: Point, o: BurstOptions) {
    const speed = o.speed ?? 9;
    for (let i = 0; i < o.count; i++) {
      const a = (o.angle ?? -Math.PI / 2) + (o.spread === undefined ? Math.random() * Math.PI * 2 : rand(-o.spread / 2, o.spread / 2));
      const v = rand(speed * 0.35, speed);
      const shape: Shape = Math.random() < 0.45 ? 'star' : Math.random() < 0.6 ? 'spark' : 'dot';
      this.particles.push({
        x: at.x,
        y: at.y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        size: (o.size ?? 7) * rand(0.55, 1.35) * (shape === 'dot' ? 0.6 : 1),
        rot: rand(0, Math.PI),
        vr: rand(-0.12, 0.12),
        life: 0,
        maxLife: (o.life ?? 1400) * rand(0.7, 1.25),
        color: pick(o.palette),
        shape,
        gravity: o.gravity ?? 0.12,
        drag: 0.965,
        twinkle: rand(0, Math.PI * 2),
      });
    }
    this.start();
  }

  /** Expanding shock-wave ring. */
  ring(at: Point, color: string, maxRadius = 140, life = 900, width = 3) {
    this.rings.push({ x: at.x, y: at.y, radius: 4, maxRadius, life: 0, maxLife: life, color, width });
    this.start();
  }

  /** Sparkles scattered along a horizontal segment (the bar's newly-filled part). */
  shimmer(from: Point, to: Point, count: number, palette: string[]) {
    for (let i = 0; i < count; i++) {
      const t = Math.random();
      this.particles.push({
        x: from.x + (to.x - from.x) * t,
        y: from.y + rand(-8, 8),
        vx: rand(-0.6, 0.6),
        vy: rand(-2.6, -0.6),
        size: rand(3, 7),
        rot: rand(0, Math.PI),
        vr: rand(-0.1, 0.1),
        life: -rand(0, 500),
        maxLife: rand(900, 1600),
        color: pick(palette),
        shape: Math.random() < 0.5 ? 'star' : 'spark',
        gravity: -0.01,
        drag: 0.98,
        twinkle: rand(0, Math.PI * 2),
      });
    }
    this.start();
  }

  /**
   * A glowing comet that travels on a curve from a gift's source (the feed)
   * to a target (the bar's leading edge), leaving a trail of light.
   * `to` is re-evaluated every frame so it follows a moving bar.
   */
  comet(from: Point, to: () => Point, opts: { duration: number; color: string; size: number; palette: string[]; onArrive: (at: Point) => void }) {
    const end = to();
    const ctrl = { x: (from.x + end.x) / 2 + rand(-120, 120), y: Math.min(from.y, end.y) - rand(160, 320) };
    this.comets.push({ from, ctrl, to, t: 0, last: from, ...opts });
    this.start();
  }

  private start() {
    if (this.frame) return;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    const dt = Math.min(48, now - this.lastTime);
    this.lastTime = now;
    const step = dt / 16.67;
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';

    // Comets
    for (let i = this.comets.length - 1; i >= 0; i--) {
      const c = this.comets[i];
      c.t = Math.min(1, c.t + dt / c.duration);
      const e = easeInOutCubic(c.t);
      const end = c.to();
      const p = bezier(c.from, c.ctrl, end, e);
      // trail
      const dx = p.x - c.last.x;
      const dy = p.y - c.last.y;
      const dist = Math.hypot(dx, dy);
      const trailBits = Math.max(1, Math.round(dist / 6));
      for (let k = 0; k < trailBits; k++) {
        const f = k / trailBits;
        this.particles.push({
          x: c.last.x + dx * f + rand(-2, 2),
          y: c.last.y + dy * f + rand(-2, 2),
          vx: rand(-0.4, 0.4),
          vy: rand(-0.2, 0.6),
          size: c.size * rand(0.25, 0.6),
          rot: 0,
          vr: 0,
          life: 0,
          maxLife: rand(380, 700),
          color: pick(c.palette),
          shape: 'dot',
          gravity: 0.02,
          drag: 0.96,
          twinkle: 0,
        });
      }
      c.last = p;
      glow(ctx, p.x, p.y, c.size * 3.2, c.color, 0.55);
      glow(ctx, p.x, p.y, c.size * 1.1, '#ffffff', 1);
      if (c.t >= 1) {
        this.comets.splice(i, 1);
        c.onArrive(end);
      }
    }

    // Rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life += dt;
      const t = r.life / r.maxLife;
      if (t >= 1) {
        this.rings.splice(i, 1);
        continue;
      }
      r.radius = 4 + (r.maxRadius - 4) * easeOutCubic(t);
      ctx.globalAlpha = (1 - t) * 0.85;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width * (1 - t * 0.6);
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life < 0) continue;
      const t = p.life / p.maxLife;
      if (t >= 1) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vx *= Math.pow(p.drag, step);
      p.vy = p.vy * Math.pow(p.drag, step) + p.gravity * step;
      p.x += p.vx * step;
      p.y += p.vy * step;
      p.rot += p.vr * step;
      const fade = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
      const tw = p.shape === 'star' ? 0.75 + 0.25 * Math.sin(p.twinkle + p.life / 90) : 1;
      ctx.globalAlpha = Math.max(0, fade * tw);
      drawParticle(ctx, p);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    if (this.particles.length || this.rings.length || this.comets.length) {
      this.frame = requestAnimationFrame(this.tick);
    } else {
      this.frame = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.fillStyle = p.color;
  if (p.shape === 'dot') {
    glow(ctx, p.x, p.y, p.size * 2.2, p.color, 0.8);
    return;
  }
  if (p.shape === 'spark') {
    const len = Math.min(26, 3 + Math.hypot(p.vx, p.vy) * 2.4);
    const a = Math.atan2(p.vy, p.vx);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = Math.max(1.2, p.size * 0.35);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - Math.cos(a) * len, p.y - Math.sin(a) * len);
    ctx.stroke();
    return;
  }
  // Eight-point star: two overlapping squares.
  const s = p.size;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.fillRect(-s / 2, -s / 2, s, s);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-s / 2, -s / 2, s, s);
  ctx.restore();
}

/** Soft glow sprites, rendered once per colour and reused (much cheaper than a gradient per particle). */
const sprites = new Map<string, HTMLCanvasElement>();
function sprite(color: string): HTMLCanvasElement {
  let c = sprites.get(color);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, withAlpha(color, 1));
    grad.addColorStop(0.35, withAlpha(color, 0.55));
    grad.addColorStop(1, withAlpha(color, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    sprites.set(color, c);
  }
  return c;
}

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number) {
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * alpha;
  ctx.drawImage(sprite(color), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = prev;
}

function withAlpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function bezier(a: Point, c: Point, b: Point, t: number): Point {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
