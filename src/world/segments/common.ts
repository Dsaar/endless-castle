import { createRandom } from '../../lib/random'
import type { InstanceTransform } from '../../scene/kit/types'

/** One bay (ken), the module most of the castle is measured in: two tatami widths. */
export const BAY = 1.82
/** Half a bay: one tatami width. */
export const HALF_BAY = 0.91

/** A stream of lantern flicker phases for a segment, stable for its seed. */
export function phaseStream(seed: number) {
  const rand = createRandom(seed ^ 0x5bd1e995)
  return () => rand() * 100
}

/**
 * Pairs of piers dropping from under a deck into the void, at each `z`, `halfSpan` either
 * side of the center line. Their tops sit at `top`. For `BoxInstances` with `anchor="base"`.
 */
export function pierPairs(zs: readonly number[], halfSpan: number, top: number, depth: number): InstanceTransform[] {
  return zs.flatMap((z) => [-1, 1].map((side): InstanceTransform => ({ position: [side * halfSpan, top - depth, z] })))
}

/** `count` evenly spaced values across (0, length), centered in equal stretches, as negative z. */
export function spreadAlong(length: number, count: number) {
  return Array.from({ length: count }, (_, i) => -((i + 0.5) * length) / count)
}
