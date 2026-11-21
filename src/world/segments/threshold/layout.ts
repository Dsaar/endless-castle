import { chance, randInt, randRange, type Random } from '../../../lib/random'
import type { LanternPlacement } from '../../../scene/kit/LanternInstances'
import type { BoxSpec, InstanceTransform } from '../../../scene/kit/types'
import { HALF_BAY, phaseStream, pierPairs, spreadAlong } from '../common'

/** Width of the walkway. The Gate's landing leaves a gap this wide for the first one. */
export const THRESHOLD_WIDTH = 4
/** The glowing tatami runner down the middle: one mat wide. */
export const STRIP_WIDTH = HALF_BAY
/** A thin cedar batten edges the runner on each side. */
const BATTEN = 0.05
/** Width of the plank floor either side of the runner. */
export const SIDE_FLOOR = (THRESHOLD_WIDTH - STRIP_WIDTH) / 2 - BATTEN
/** Center x of each side floor. */
export const SIDE_FLOOR_X = STRIP_WIDTH / 2 + BATTEN + SIDE_FLOOR / 2
const LANTERN_X = THRESHOLD_WIDTH / 2 - 0.4
const FASCIA = 0.42
const DECK = 0.04
export const PIER_DEPTH = 18
export const PIER_SIZE = 0.3

export interface ThresholdParams {
  /** Rows of lanterns; the walkway is `rows × spacing` long. */
  rows: number
  /** Distance between lantern rows (meters). */
  spacing: number
  length: number
  /** The right-hand lanterns sit halfway between the left-hand ones. */
  staggered: boolean
  /** A cedar frame (two posts and a lintel) stands over the far end. */
  endFrame: boolean
  seed: number
}

export function generateThreshold(rand: Random): ThresholdParams {
  const spacing = randRange(rand, 2.4, 3.6)
  const rows = randInt(rand, Math.ceil(12 / spacing), Math.floor(24 / spacing))
  return {
    rows,
    spacing,
    length: rows * spacing,
    staggered: chance(rand, 0.4),
    endFrame: chance(rand, 0.65),
    seed: randInt(rand, 1, 999_999),
  }
}

export interface ThresholdLayout {
  boxes: BoxSpec[]
  piers: InstanceTransform[]
  lanterns: LanternPlacement[]
}

/** Every piece's place, in the segment's frame (start at the origin, walking -Z). */
export function buildThresholdLayout(p: ThresholdParams): ThresholdLayout {
  const L = p.length
  const W = THRESHOLD_WIDTH
  const phase = phaseStream(p.seed)
  const boxes: BoxSpec[] = []

  // Battens edging the runner, a touch proud of the floor.
  for (const side of [-1, 1]) {
    boxes.push({ size: [BATTEN, DECK + 0.012, L], position: [side * (STRIP_WIDTH / 2 + BATTEN / 2), -DECK / 2 + 0.006, -L / 2] })
  }
  // Deep fascia beams round the deck edge, so it has some thickness against the void.
  for (const side of [-1, 1]) {
    boxes.push({ size: [0.14, FASCIA, L], position: [side * (W / 2 - 0.07), -DECK - FASCIA / 2, -L / 2] })
  }
  for (const z of [-0.07, -L + 0.07]) {
    boxes.push({ size: [W - 0.28, FASCIA, 0.14], position: [0, -DECK - FASCIA / 2, z] })
  }

  // Sleepers under the deck where the piers meet it.
  const pierZ = spreadAlong(L, Math.max(2, Math.round(L / 6)))
  const pierTop = -DECK - FASCIA - 0.26
  for (const z of pierZ) {
    boxes.push({ size: [W + 0.4, 0.26, 0.26], position: [0, -DECK - FASCIA - 0.13, z] })
  }

  if (p.endFrame) {
    // Two posts, a tie beam and a broad lintel over the far end: a frame to walk through.
    const z = -L + 0.5
    for (const side of [-1, 1]) {
      boxes.push({ size: [0.26, 3.3, 0.26], position: [side * (W / 2 - 0.2), 1.65, z] })
    }
    boxes.push({ size: [W - 0.1, 0.16, 0.14], position: [0, 2.75, z] })
    boxes.push({ size: [W + 1.0, 0.24, 0.32], position: [0, 3.42, z] })
  }

  const lanterns: LanternPlacement[] = []
  for (let i = 0; i < p.rows; i++) {
    lanterns.push({ position: [-LANTERN_X, 0, -(i + 0.5) * p.spacing], phase: phase() })
    const zr = p.staggered ? -(i + 1) * p.spacing : -(i + 0.5) * p.spacing
    if (zr > -L + 0.3) lanterns.push({ position: [LANTERN_X, 0, zr], phase: phase() })
  }

  return { boxes, piers: pierPairs(pierZ, W / 2 - 0.35, pierTop, PIER_DEPTH), lanterns }
}
