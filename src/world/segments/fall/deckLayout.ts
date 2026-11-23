import { createRandom } from '../../../lib/random'
import type { Vec3 } from '../../../scene/kit/types'
import { DECK_LENGTH, DECK_WIDTH } from './layout'

/** Gap down the middle, where each plank splits in two. */
const SPLIT_GAP = 0.02
/** One half of a cross plank. */
export const DECK_PLANK: Vec3 = [(DECK_WIDTH - SPLIT_GAP) / 2, 0.05, 0.22]
const PLANK_PITCH = 0.25
/** Beams under the planks, in short lengths so they can break apart too. */
export const DECK_STRINGER: Vec3 = [0.12, 0.2, 2]
const STRINGER_X = 1.3
/** Past this far onto the deck (meters), a few plank halves are already missing. */
const SOUND_LENGTH = 3
const MISSING_CHANCE = 0.07

export interface DeckPiece {
  /** Center, in the segment's frame. */
  position: Vec3
  yaw: number
  /** Which half of the deck it is on: the halves split apart toward their own side. */
  side: -1 | 1
}

export interface DeckLayout {
  planks: DeckPiece[]
  stringers: DeckPiece[]
}

/**
 * The deck: cross planks split down the middle, a little uneven, with a few already gone
 * toward the far end, over two lines of short stringers. Its top is at y = 0, flush with the
 * Threshold.
 */
export function buildDeckLayout(seed: number): DeckLayout {
  const rand = createRandom(seed)
  const planks: DeckPiece[] = []
  const rows = Math.round(DECK_LENGTH / PLANK_PITCH)
  for (let i = 0; i < rows; i++) {
    const z = -(i + 0.5) * PLANK_PITCH
    for (const side of [-1, 1] as const) {
      const jitterY = (rand() - 0.5) * 0.012
      const yaw = (rand() - 0.5) * 0.03
      if (-z > SOUND_LENGTH && rand() < MISSING_CHANCE) continue
      planks.push({ position: [side * (DECK_PLANK[0] + SPLIT_GAP) / 2, -DECK_PLANK[1] / 2 + jitterY, z], yaw, side })
    }
  }

  const stringers: DeckPiece[] = []
  const y = -DECK_PLANK[1] - DECK_STRINGER[1] / 2
  for (let z = -DECK_STRINGER[2] / 2; z > -DECK_LENGTH; z -= DECK_STRINGER[2]) {
    for (const side of [-1, 1] as const) stringers.push({ position: [side * STRINGER_X, y, z], yaw: 0, side })
  }
  return { planks, stringers }
}
