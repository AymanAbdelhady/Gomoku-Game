import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export const STAGE_W = 1920;
export const STAGE_H = 1080;

/**
 * Renders children on a fixed 1920×1080 canvas scaled to fit its container.
 * The composition is therefore identical on a venue LED wall, a 4:3
 * projector (letterboxed) or the operator's preview thumbnail.
 */
export function ScaledStage({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ s: 0, x: 0, y: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const s = Math.min(w / STAGE_W, h / STAGE_H);
      setBox({ s, x: (w - STAGE_W * s) / 2, y: (h - STAGE_H * s) / 2 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn('relative overflow-hidden bg-[#050d1f]', className)}>
      <div
        className="absolute left-0 top-0"
        style={{ width: STAGE_W, height: STAGE_H, transform: `translate(${box.x}px, ${box.y}px) scale(${box.s})`, transformOrigin: '0 0', visibility: box.s ? 'visible' : 'hidden' }}
      >
        {children}
      </div>
    </div>
  );
}
