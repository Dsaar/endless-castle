/** A random source: floats in [0, 1). */
export type Random = () => number

/**
 * Small seeded PRNG (mulberry32). Returns a function giving floats in [0, 1).
 * Seeded so procedural layouts (stars, motes, the castle) are stable between reloads.
 */
export function createRandom(seed: number): Random {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Mixes several integers into one well-spread 32-bit seed (e.g. world seed + segment index). */
export function hashSeed(...parts: number[]): number {
  let h = 0x811c9dc5
  for (const part of parts) {
    h = Math.imul(h ^ (part >>> 0), 0x01000193)
    h ^= h >>> 15
    h = Math.imul(h, 0x2c1b3c6d)
    h ^= h >>> 12
  }
  return h >>> 0
}

/** A float in [min, max). */
export function randRange(rand: Random, min: number, max: number) {
  return min + rand() * (max - min)
}

/** An integer in [min, max], both included. */
export function randInt(rand: Random, min: number, max: number) {
  return min + Math.floor(rand() * (max - min + 1))
}

/** True with probability `p`. */
export function chance(rand: Random, p: number) {
  return rand() < p
}

/** One item, uniformly. */
export function pick<T>(rand: Random, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)]
}

/** One key, weighted by its value. */
export function pickWeighted<K extends string>(rand: Random, weights: Readonly<Partial<Record<K, number>>>): K {
  const entries = Object.entries(weights) as [K, number][]
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let r = rand() * total
  for (const [key, w] of entries) {
    r -= w
    if (r < 0) return key
  }
  return entries[entries.length - 1][0]
}
