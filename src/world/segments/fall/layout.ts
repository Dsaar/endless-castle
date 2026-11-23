import { randInt, type Random } from '../../../lib/random'
import type { SegmentPlan } from '../../segment'
import { THRESHOLD_WIDTH } from '../threshold/layout'

/** The old plank deck the first Threshold runs out onto: as wide as the Threshold, and this long. */
export const DECK_WIDTH = THRESHOLD_WIDTH
export const DECK_LENGTH = 8
/** How far below the deck the Suspended Walkway waits (meters, floor to floor). */
export const FALL_DROP = 120
/** How far ahead of the deck's start the walkway begins: the fall drifts forward this much. */
export const FALL_FORWARD = DECK_LENGTH
/** The script starts this far onto the deck (meters): as soon as the player steps on it. */
export const FALL_TRIGGER = 0

export interface FallParams {
  /** Varies the deck's missing planks and everything in the shaft. */
  seed: number
}

export function generateFall(rand: Random): FallParams {
  return { seed: randInt(rand, 1, 999_999) }
}

/**
 * The walk is only the deck. The exit is far below, where the Suspended Walkway starts: the
 * Fall is the one segment whose next neighbour doesn't begin where its walk ends. The camera
 * is scripted across the gap (`FallDirector`), and the way back up is sealed once it lands.
 */
export function fallPlan(): SegmentPlan {
  return {
    points: [
      [0, 0, 0],
      [0, 0, -DECK_LENGTH],
    ],
    end: { x: 0, y: -FALL_DROP, z: -FALL_FORWARD, yaw: 0 },
  }
}
