/**
 * Prepares an uploaded logo: SVGs are kept as-is (vector, small), bitmaps are
 * scaled to fit 800×400 and re-encoded as WebP with transparency, which keeps
 * them small enough to live in event settings.
 */
export async function prepareLogo(file: File): Promise<string> {
  const MAX_SVG = 200_000;
  if (file.type === 'image/svg+xml') {
    if (file.size > MAX_SVG) throw new Error('That SVG is larger than 200 KB. Please export a simpler version.');
    return readAsDataUrl(file);
  }
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) throw new Error('Please choose a PNG, JPG, WebP or SVG image.');
  if (file.size > 8_000_000) throw new Error('That image is larger than 8 MB.');
  const url = await readAsDataUrl(file);
  const img = await loadImage(url);
  const scale = Math.min(1, 800 / img.naturalWidth, 400 / img.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const webp = canvas.toDataURL('image/webp', 0.92);
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png');
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read that file.'));
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That file is not a readable image.'));
    img.src = src;
  });
}
