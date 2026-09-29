import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Gives its content a brief, springy "pop" each time `trigger` changes,
 * without remounting (so counters keep counting smoothly).
 */
export function Pop({ trigger, children, className, scale = 1.045, celebrate }: { trigger: string | number; children: ReactNode; className?: string; scale?: number; celebrate?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current || trigger === 'initial') {
      first.current = false;
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || ref.current?.closest('[data-motion="reduced"]')) return;
    ref.current?.animate(
      [{ transform: 'scale(1)' }, { transform: `scale(${scale})`, offset: 0.2 }, { transform: 'scale(1)' }],
      { duration: 1100, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
  }, [trigger, scale]);
  return (
    <div ref={ref} className={className} data-celebrate={celebrate} style={{ transformOrigin: 'left center' }}>
      {children}
    </div>
  );
}
