import { pick, randInt, type Random } from '../../lib/random'
import type { LanternPlacement } from '../../scene/kit/LanternInstances'
import type { BoxSpec, InstanceTransform, Vec3 } from '../../scene/kit/types'
import { addFlight, landingHeight, landingStart, STAIR_TREAD, type Flight } from '../segments/stairs'

const WIDTH = 1.2
const LANDING_LENGTH = 1.0
const LANDING_SLAB = 0.1
const POST = 0.1

/** A flight hung upside down from a ceiling: where, which way, and how many steps. */
export interface HangingStairsSpec {
  /** Middle of its footprint on the ceiling, in the room's frame. */
  x: number
  z: number
  /** Which way the flight runs (0: toward -Z). */
  yaw: number
  risers: number
}

/** Its footprint's length along its run, for keeping it inside a room. */
export function hangingStairsLength(risers: number) {
  return (risers - 1) * STAIR_TREAD + LANDING_LENGTH
}

/** A flight for a quadrant of a square room `size` wide (centered on `center`), clear of its middle. */
export function generateHangingStairs(rand: Random, center: Vec3, size: number): HangingStairsSpec {
  const qx = pick(rand, [-1, 1])
  const qz = pick(rand, [-1, 1])
  return {
    x: center[0] + (qx * size) / 4,
    z: center[2] + (qz * size) / 4,
    yaw: pick(rand, [0, Math.PI / 2, Math.PI, -Math.PI / 2]),
    risers: randInt(rand, 7, 9),
  }
}

export interface HangingStairsLayout {
  treads: InstanceTransform[]
  risers: InstanceTransform[]
  boxes: BoxSpec[]
  /** A standing lantern on the landing, upside down like the rest. */
  lantern: LanternPlacement[]
  width: number
}

/**
 * The pieces, in the flight's own frame with the ceiling at y = 0: a normal flight standing on
 * the ceiling, reflected, so its treads step down into the room and its landing hangs lowest,
 * held up by posts to the ceiling (they would stand on the floor the right way up). Closed
 * risers give it a clear stepped profile from below, and a lantern stands on the landing,
 * hanging head down into the room.
 */
export function buildHangingStairs(spec: HangingStairsSpec): HangingStairsLayout {
  const length = hangingStairsLength(spec.risers)
  const flight: Flight = { x: 0, y: 0, z: length / 2, rise: 1, risers: spec.risers, width: WIDTH }
  const out = { treads: [] as InstanceTransform[], boxes: [] as BoxSpec[], risers: [] as InstanceTransform[] }
  addFlight(out, flight, 0)

  const top = landingHeight(flight)
  const z0 = landingStart(flight)
  const z1 = -length / 2
  out.boxes.push({ size: [WIDTH + 0.1, LANDING_SLAB, z0 - z1], position: [0, -(top - LANDING_SLAB / 2), (z0 + z1) / 2] })
  // Posts from the landing's far corners up to the ceiling.
  for (const side of [-1, 1]) {
    out.boxes.push({ size: [POST, top, POST], position: [side * (WIDTH / 2), -top / 2, z1 + POST / 2], grain: 1 })
  }
  const lantern: LanternPlacement[] = [{ position: [0, -top, (z0 + z1) / 2], pitch: Math.PI, phase: spec.risers * 7.3 }]
  return { treads: out.treads, risers: out.risers, boxes: out.boxes, lantern, width: WIDTH }
}
