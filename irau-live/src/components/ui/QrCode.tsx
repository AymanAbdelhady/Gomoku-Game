import { useMemo } from 'react';
import { qrMatrix } from '../../utils/qr';

/** Crisp vector QR code with a quiet zone. Generated locally — no third-party service sees the URL. */
export function QrCode({ value, size, className, fg = '#0b1a3a', bg = '#ffffff', label }: { value: string; size: number; className?: string; fg?: string; bg?: string; label?: string }) {
  const { size: n, path } = useMemo(() => qrMatrix(value, 'Q'), [value]);
  const quiet = 2;
  return (
    <svg
      role="img"
      aria-label={label ?? `QR code linking to ${value}`}
      viewBox={`${-quiet} ${-quiet} ${n + quiet * 2} ${n + quiet * 2}`}
      width={size}
      height={size}
      className={className}
      shapeRendering="crispEdges"
    >
      <rect x={-quiet} y={-quiet} width={n + quiet * 2} height={n + quiet * 2} fill={bg} />
      <path d={path} fill={fg} />
    </svg>
  );
}
