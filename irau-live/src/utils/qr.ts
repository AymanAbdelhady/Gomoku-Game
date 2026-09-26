import qrcode from 'qrcode-generator';

export interface QrMatrix {
  size: number;
  /** SVG path data, one unit per module. */
  path: string;
}

/** Encodes text into a QR module matrix and a compact SVG path (no canvas, no network). */
export function qrMatrix(text: string, level: 'L' | 'M' | 'Q' | 'H' = 'M'): QrMatrix {
  const qr = qrcode(0, level);
  qr.addData(text || ' ');
  qr.make();
  const size = qr.getModuleCount();
  let path = '';
  for (let row = 0; row < size; row++) {
    let col = 0;
    while (col < size) {
      if (qr.isDark(row, col)) {
        const start = col;
        while (col < size && qr.isDark(row, col)) col++;
        path += `M${start} ${row}h${col - start}v1h${start - col}z`;
      } else {
        col++;
      }
    }
  }
  return { size, path };
}
