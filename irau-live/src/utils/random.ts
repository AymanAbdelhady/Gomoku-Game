/** Small deterministic PRNG so demo ticks are pure/reproducible (same seed → same gift). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted<T>(rand: () => number, items: [T, number][]): T {
  const total = items.reduce((sum, [, w]) => sum + w, 0);
  let r = rand() * total;
  for (const [item, w] of items) {
    if ((r -= w) <= 0) return item;
  }
  return items[items.length - 1][0];
}
