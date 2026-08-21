/**
 * A seeded LCG, carried explicitly.
 *
 * Same corpus generation seed must produce byte-identical output on a laptop
 * and in CI, so `Math.random()` is banned everywhere below `app/`.
 *
 * Numerical Recipes constants; 32-bit state.
 */
export class Rng {
  private state: number;

  constructor(seed: number) {
    // Avoid the zero fixed point, and keep the state in uint32.
    this.state = (seed >>> 0) || 0x9e3779b9;
  }

  /** Uniform in [0, 1). */
  next(): number {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state / 0x1_0000_0000;
  }

  /** Uniform integer in [0, n). */
  int(n: number): number {
    return Math.floor(this.next() * n);
  }

  /** Uniform integer in [min, max]. */
  intBetween(min: number, max: number): number {
    return min + this.int(max - min + 1);
  }

  /** True with probability `p`. */
  bool(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error("Rng.pick: empty array");
    return items[this.int(items.length)] as T;
  }

  /** Picks an index according to relative `weights`. */
  weightedIndex(weights: readonly number[]): number {
    const total = weights.reduce((a, b) => a + b, 0);
    let x = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      x -= weights[i] as number;
      if (x < 0) return i;
    }
    return weights.length - 1;
  }
}

/**
 * Mixes a base seed with a label so independent streams (company names,
 * firmographics, signal generation, ...) never accidentally share one.
 */
export function derive(seed: number, label: string): number {
  let h = seed >>> 0;
  for (let i = 0; i < label.length; i++) {
    h = (Math.imul(h ^ label.charCodeAt(i), 16777619) + 1) >>> 0;
  }
  return h;
}
