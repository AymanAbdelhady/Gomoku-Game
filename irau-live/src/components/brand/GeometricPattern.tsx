import { useId } from 'react';

/**
 * Eight-point star (khatam) lattice — a quiet nod to Islamic geometric art,
 * drawn at very low contrast so it adds texture without competing with text.
 */
export function GeometricPattern({ className, opacity = 0.05, tile = 120 }: { className?: string; opacity?: number; tile?: number }) {
  const id = useId().replace(/:/g, '');
  const h = tile / 2;
  const q = h / Math.SQRT2;
  const diamond = `M${h} 0 L${tile} ${h} L${h} ${tile} L0 ${h} Z`;
  const square = `M${h - q} ${h - q} H${h + q} V${h + q} H${h - q} Z`;
  return (
    <svg className={className} aria-hidden="true" width="100%" height="100%">
      <defs>
        <pattern id={`p${id}`} width={tile} height={tile} patternUnits="userSpaceOnUse">
          <g fill="none" stroke="white" strokeWidth="1" opacity={opacity}>
            <path d={diamond} />
            <path d={square} />
            <circle cx={h} cy={h} r={tile * 0.14} />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#p${id})`} />
    </svg>
  );
}
