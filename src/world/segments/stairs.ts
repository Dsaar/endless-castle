import type { BoxSpec, InstanceTransform, Vec3 } from '../../scene/kit/types'

/**
 * Every staircase in the castle shares one step: the Stairwell's flights you walk, and the
 * flights hanging upside down from hall ceilings. `Player` times its stair bob to the riser.
 */
export const STAIR_RISER = 0.2
export const STAIR_TREAD = 0.28
export const TREAD_THICKNESS = 0.05
/** Treads overlap a little, so there is no gap between them seen from below. */
const TREAD_OVERLAP = 0.03
const STRINGER: [width: number, height: number] = [0.08, 0.28]
/** The stringers' middle sits this far under the walking line. */
const STRINGER_DROP = 0.2

/** A tread box for `BoxInstances`, for a flight `width` wide. */
export function treadSize(width: number): Vec3 {
  return [width, TREAD_THICKNESS, STAIR_TREAD + TREAD_OVERLAP]
}

export interface Flight {
  /** x of the flight's center line. */
  x: number
  /** Floor height at its foot. */
  y: number
  /** z of the first riser. The flight runs toward -Z. */
  z: number
  /** +1 climbs, -1 descends. */
  rise: 1 | -1
  /** Risers from the foot to the landing (the treads between are one fewer). */
  risers: number
  width: number
}

/** Height of the landing a flight arrives at. */
export function landingHeight(f: Flight) {
  return f.y + f.rise * f.risers * STAIR_RISER
}

/** z where the landing begins (the last riser). */
export function landingStart(f: Flight) {
  return f.z - (f.risers - 1) * STAIR_TREAD
}

/**
 * The walking line, through the middle of every tread: from half a tread before the first
 * riser to half a tread onto the landing. Floor height at `z` along it.
 */
export function walkHeight(f: Flight, z: number) {
  return f.y + f.rise * STAIR_RISER * ((f.z - z) / STAIR_TREAD + 0.5)
}

/** z where the walking line meets the foot's floor, and where it reaches the landing. */
export function walkFoot(f: Flight) {
  return f.z + STAIR_TREAD / 2
}
export function walkTop(f: Flight) {
  return f.z - (f.risers - 0.5) * STAIR_TREAD
}

/** A riser board, for `BoxInstances`, for a flight `width` wide. */
export function riserSize(width: number): Vec3 {
  return [width, STAIR_RISER, RISER_THICKNESS]
}
const RISER_THICKNESS = 0.03

export interface FlightPieces {
  treads: InstanceTransform[]
  boxes: BoxSpec[]
  /** Closed risers, when the pieces were asked for them. */
  risers?: InstanceTransform[]
}

/**
 * A flight's treads and its two stringers, appended to `out` (and its risers, if `out` has a
 * list for them). With `mirror`, everything is reflected about the plane y = `mirror`: a
 * flight standing on a ceiling, upside down.
 */
export function addFlight(out: FlightPieces, f: Flight, mirror?: number) {
  const flip = (y: number) => (mirror === undefined ? y : 2 * mirror - y)
  const sign = mirror === undefined ? 1 : -1
  for (let k = 1; k < f.risers; k++) {
    const top = f.y + f.rise * k * STAIR_RISER
    out.treads.push({ position: [f.x, flip(top - TREAD_THICKNESS / 2), f.z - (k - 0.5) * STAIR_TREAD] })
  }
  if (out.risers) {
    for (let k = 1; k <= f.risers; k++) {
      const mid = f.y + f.rise * (k - 0.5) * STAIR_RISER
      out.risers.push({ position: [f.x, flip(mid), f.z - (k - 1) * STAIR_TREAD + RISER_THICKNESS / 2] })
    }
  }

  const run = f.risers * STAIR_TREAD
  const height = f.risers * STAIR_RISER
  const zMid = (walkFoot(f) + walkTop(f)) / 2
  const yMid = walkHeight(f, zMid) - STRINGER_DROP
  const pitch = sign * f.rise * Math.atan2(height, run)
  for (const side of [-1, 1]) {
    out.boxes.push({
      size: [STRINGER[0], STRINGER[1], Math.hypot(run, height)],
      position: [f.x + side * (f.width / 2 - STRINGER[0] / 2), flip(yMid), zMid],
      pitch,
      grain: 2,
    })
  }
}
