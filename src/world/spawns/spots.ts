import { chance, createRandom, hashSeed, randInt, randRange, type Random } from '../../lib/random'
import type { Vec3 } from '../../scene/kit/types'
import { FIGURE_BY_AREA, FIGURES, type FigureArea } from '../figures'
import { turnPoint, type Segment } from '../segment'
import { BALCONY_REACH, buildTowerLayout, type AbyssParams } from '../segments/abyss/layout'
import type { GalleryParams } from '../segments/gallery/layout'
import { HALL_HEIGHT, HALL_SIZE, type HallParams } from '../segments/hall/layout'
import type { StairwellParams } from '../segments/stairwell/layout'
import type { ThresholdParams } from '../segments/threshold/layout'
import { besideWalkway, type WalkwayParams } from '../segments/walkway/layout'
import type { PavilionSpec } from '../pieces/pavilionLayout'
import { OPENING_LENGTH } from '../WorldGenerator'
import { SPAWN_CHANCE, spawnOverride } from './tuning'

/**
 * Where a room's hidden figure stands: always off the walk, somewhere you only see if you turn
 * your head. Worked out from the room's params, in its own frame. Each spot is placed so it can
 * be centered in the view (the look reaches 60° either side of the walk) from a good stretch of
 * the walk, and perches stand at or below eye level: from under a perch, its floor hides the
 * figure on it.
 *
 * - The Threshold: a broken piece of another deck floating off to one side, a little ahead.
 * - The Suspended Walkway: a stretch of another walkway out in the void, crossing at an angle.
 * - The Open Gallery: a far balcony on the open side, in front of a wall of lit shoji.
 * - The Forking Hall: up in a far corner, standing on the ceiling, head down.
 * - The Stairwell: a platform floating beside the tower, above the deck where you stop.
 * - The Central Abyss: on the balcony of one of the towers ahead, across the void.
 */

/** A floating piece of floor for a figure to stand on. */
export interface PerchSpec {
  /** A loose piece of deck (with a lantern), or a balcony in front of a lit shoji wall. */
  kind: 'deck' | 'balcony'
  /** Middle of its floor's top, in the segment's frame. */
  position: Vec3
  /** Its front (local +Z) faces the walk. Same convention as segments. */
  yaw: number
  /** Across its front (local X)… */
  length: number
  /** …and front to back (local Z). */
  width: number
  /** Railings along the front and back (deck only). */
  rails: boolean
  /** Which end the lantern stands at (deck only): away from the figure. */
  lanternSide: -1 | 1
  seed: number
}

export interface FigureSpot {
  /** Index into FIGURES. */
  index: number
  /** Where its feet are, in the segment's frame. */
  position: Vec3
  upsideDown: boolean
  perch: PerchSpec | null
}

/** Keeps the spot's random numbers apart from the room's own. */
const SPOT_SALT = 0x51ed270b
/** A perch keeps this far (horizontally) from any floating pavilion, whose struts hang far below. */
const PAVILION_CLEARANCE = 9
const TRIES = 10

/** The figure that may hide in `segment`, and where, or null (wrong area, the opening, or not this time). */
export function figureSpot(segment: Segment): FigureSpot | null {
  if (segment.id < OPENING_LENGTH) return null
  const index = FIGURE_BY_AREA[segment.kind as FigureArea]
  if (index === undefined) return null
  const area = FIGURES[index].area
  const seed = (segment.params as { seed: number }).seed
  const rand = createRandom(hashSeed(seed, SPOT_SALT))
  // Always drawn, so forcing it (dev) doesn't move the spot.
  const here = chance(rand, SPAWN_CHANCE[area])
  if (!here && !spawnOverride.always) return null
  return SPOTS[area](rand, segment.params as never, index)
}

const SPOTS: Record<FigureArea, (rand: Random, params: never, index: number) => FigureSpot | null> = {
  threshold: (rand, p: ThresholdParams, index) => {
    const side = sign(rand)
    const position: Vec3 = [side * randRange(rand, 9, 13), randRange(rand, -3.5, 0.3), -p.length * randRange(rand, 0.6, 0.95)]
    return onPerch(rand, index, deck(rand, position, facing(side) + randRange(rand, -0.35, 0.35), randRange(rand, 3.5, 5), 2.4, false))
  },

  walkway: (rand, p: WalkwayParams, index) => {
    for (let i = 0; i < TRIES; i++) {
      const side = sign(rand)
      const at = besideWalkway(p, randRange(rand, 0.6, 0.95), side, randRange(rand, 10, 15), randRange(rand, -5.5, 0.3))
      if (!clearOf(at.position, p.pavilions)) continue
      // Facing back across to the walk, and turned well off square, so it crosses at an angle.
      const yaw = at.yaw - side * (Math.PI / 2) + randRange(rand, 0.3, 0.6) * sign(rand)
      return onPerch(rand, index, deck(rand, at.position, yaw, randRange(rand, 7, 10), 1.6, true))
    }
    return null
  },

  gallery: (rand, p: GalleryParams, index) => {
    const open = -p.side
    for (let i = 0; i < TRIES; i++) {
      const position: Vec3 = [open * randRange(rand, 11, 14), randRange(rand, -2, 0.5), -randRange(rand, p.length * 0.7, p.length - 0.8)]
      if (!clearOf(position, p.pavilions)) continue
      const perch: PerchSpec = {
        kind: 'balcony',
        position,
        yaw: facing(open) + randRange(rand, -0.25, 0.25),
        length: 2.8,
        width: 1.5,
        rails: true,
        lanternSide: 1,
        seed: randInt(rand, 1, 999_999),
      }
      return { index, position: perchPoint(perch, randRange(rand, -0.5, 0.5), 0.1), upsideDown: false, perch }
    }
    return null
  },

  junction: (rand, p: HallParams, index) => {
    const H = HALL_SIZE / 2
    // A far corner, the other side from a hanging flight in the far half of the hall.
    const sx = p.hanging && p.hanging.z < -H ? (p.hanging.x > 0 ? -1 : 1) : sign(rand)
    const inset = 1.2
    // Feet just under the coffers.
    return { index, position: [sx * (H - inset), HALL_HEIGHT - 0.06, -H - (H - inset)], upsideDown: true, perch: null }
  },

  stairwell: (rand, _p: StairwellParams, index) => {
    const side = sign(rand)
    // Far enough ahead to be turned to from where the walk stops (the look reaches 60° either way),
    // and clear of the room after the flights (a Forking Hall's side passage starts 12 m in).
    const position: Vec3 = [side * randRange(rand, 8, 10), randRange(rand, -1, 1.2), randRange(rand, -10, -7.5)]
    return onPerch(rand, index, deck(rand, position, facing(side) + randRange(rand, -0.3, 0.3), 2.8, 2.6, true))
  },

  abyss: (rand, p: AbyssParams, index) => {
    // A tower ahead of the void's middle, so it can be seen from the bridge before you pass it.
    const middle = -p.length / 2
    const ahead = buildTowerLayout(p).balconies.filter((b) => b.position[2] < middle - 4)
    if (ahead.length === 0) return null
    const b = ahead[randInt(rand, 0, ahead.length - 1)]
    // The face that looks most toward the first quarter of the bridge, where it is seen from (the
    // towers are turned, so the face square to the bridge can point away from you), halfway out
    // across the slab.
    const tx = -b.position[0]
    const tz = -p.length / 4 - b.position[2]
    const c = Math.cos(b.yaw)
    const s = Math.sin(b.yaw)
    // The tower's local ±X and ±Z axes, in the segment's frame (as `addTower` places them).
    const axes: [number, number][] = [
      [c, -s],
      [-c, s],
      [s, c],
      [-s, -c],
    ]
    let best = axes[0]
    for (const a of axes) if (a[0] * tx + a[1] * tz > best[0] * tx + best[1] * tz) best = a
    const out = b.halfWidth + BALCONY_REACH / 2
    return {
      index,
      position: [b.position[0] + best[0] * out, b.position[1], b.position[2] + best[1] * out],
      upsideDown: false,
      perch: null,
    }
  },
}

function sign(rand: Random): -1 | 1 {
  return chance(rand, 0.5) ? -1 : 1
}

/** The yaw that turns a perch's front toward the walk, for a perch on `side` of it (the walk runs down -Z). */
function facing(side: number) {
  return -side * (Math.PI / 2)
}

function deck(rand: Random, position: Vec3, yaw: number, length: number, width: number, rails: boolean): PerchSpec {
  return { kind: 'deck', position, yaw, length, width, rails, lanternSide: 1, seed: randInt(rand, 1, 999_999) }
}

/** The figure somewhere along a deck, toward the front; the lantern at the other end. */
function onPerch(rand: Random, index: number, perch: PerchSpec): FigureSpot {
  const reach = Math.max(0, perch.length / 2 - 0.8)
  const x = randRange(rand, -reach, reach)
  perch.lanternSide = x > 0 ? -1 : 1
  return { index, position: perchPoint(perch, x, randRange(rand, -0.1, perch.width / 4)), upsideDown: false, perch }
}

/** A point on a perch's floor (its local x, z) in the segment's frame. */
function perchPoint(perch: PerchSpec, x: number, z: number): Vec3 {
  const [dx, , dz] = turnPoint([x, 0, z], perch.yaw)
  return [perch.position[0] + dx, perch.position[1], perch.position[2] + dz]
}

function clearOf(position: Vec3, pavilions: readonly PavilionSpec[]) {
  return pavilions.every((v) => Math.hypot(v.position[0] - position[0], v.position[2] - position[2]) >= PAVILION_CLEARANCE)
}
