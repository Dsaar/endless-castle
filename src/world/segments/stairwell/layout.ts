import { chance, randInt, type Random } from '../../../lib/random'
import { CORD_BASE } from '../../../scene/kit/lanternGeometry'
import type { LanternPlacement } from '../../../scene/kit/LanternInstances'
import type { BoxSpec, InstanceTransform, Vec3 } from '../../../scene/kit/types'
import type { BranchChoice, BranchPlan, SegmentPlan } from '../../segment'
import { BAY, phaseStream } from '../common'
import {
  addFlight,
  landingHeight,
  landingStart,
  STAIR_RISER,
  STAIR_TREAD,
  walkFoot,
  walkHeight,
  walkTop,
  type Flight,
} from '../stairs'

/**
 * The Stairwell: an open stair tower. A deck where the way splits, then two flights side by
 * side, one climbing to a landing a story up and one going down to a landing a story below,
 * all under one roof on four tall posts. Everything is in the segment's frame, the deck's
 * front edge at the origin.
 */
export const DECK_WIDTH = 2 * BAY
const DH = DECK_WIDTH / 2
export const DECK_LENGTH = 4.2
/** The walk stops here, on the deck, where both flights can be seen. */
const FORK_Z = 1.2
const FLIGHT_X = 1.0
export const FLIGHT_WIDTH = 1.4
/** 13 risers of 0.2 m: a story, the height of a Tatami Room. */
const RISERS = 13
const LANDING_LENGTH = 2.2
const FOOT_Z = -DECK_LENGTH
const END_Z = FOOT_Z - (RISERS - 1) * STAIR_TREAD - LANDING_LENGTH
/** Eave height of the roof over the whole tower. */
const TOWER_TOP = 6.4
const TOWER_POST_X = 1.95
export const TOWER_POST: Vec3 = [0.2, 22, 0.2]
const TOWER_POST_BASE = TOWER_TOP - TOWER_POST[1]
export const SUPPORT: Vec3 = [0.16, 14, 0.16]
export const BALUSTER: Vec3 = [0.05, 0.9, 0.05]
const RAIL_HEIGHT = 0.9
const RAIL: [number, number] = [0.07, 0.07]
const LANDING_SLAB = 0.12
export const FORK_LANTERN_SIZE = 1.2
/** A small lantern on the newel post between the flights, lighting the first steps of both. */
export const NEWEL_LANTERN_SIZE = 0.55
const NEWEL_HEIGHT = 1.15
const FORK_LANTERN_Y = 3.6
const TIE_Y = TOWER_TOP - 0.1
export const FORK_LANTERN_CORD = (TIE_Y - 0.08 - FORK_LANTERN_Y) / FORK_LANTERN_SIZE - CORD_BASE
/** Seconds the step across to the chosen flight takes. */
const STEP_ACROSS_TIME = 1.5
/** The bend across the deck to a flight starts this far past the fork and ends level with the flight here. */
const BEND_START = -FORK_Z - 0.2
const BEND_END = -3.5
const BEND_STEP = 0.25

export interface StairwellParams {
  /** Which side the up flight is on (-1 left, 1 right); the down flight takes the other. */
  upSide: -1 | 1
  seed: number
}

export function generateStairwell(rand: Random): StairwellParams {
  return { upSide: chance(rand, 0.5) ? -1 : 1, seed: randInt(rand, 1, 999_999) }
}

function flightOf(p: StairwellParams, rise: 1 | -1): Flight {
  return { x: rise * p.upSide * FLIGHT_X, y: 0, z: FOOT_Z, rise, risers: RISERS, width: FLIGHT_WIDTH }
}

/** The walk in: onto the deck, stopping where the two flights part. */
export function stairwellPlan(): SegmentPlan {
  return { points: [[0, 0, 0], [0, 0, -FORK_Z]], end: { x: 0, y: 0, z: -FORK_Z, yaw: 0 } }
}

/**
 * The walk down or up: an S-bend across the deck to the foot of the flight (carried along for
 * the player when they choose), straight up or down the flight's walking line, and across its
 * landing to where the next room attaches. In the frame of the fork point.
 */
export function stairwellBranch(p: StairwellParams, choice: BranchChoice): BranchPlan {
  const f = flightOf(p, choice === 'down' ? -1 : 1)
  const sx = f.x
  const foot = walkFoot(f)
  const top = walkTop(f)
  const level = landingHeight(f)
  const along = (u: number) => foot + (top - foot) * u
  // A smootherstep sideways: no kink where it leaves the fork or meets the flight's line.
  const bend: Vec3[] = []
  const steps = Math.round((BEND_START - BEND_END) / BEND_STEP)
  for (let k = 0; k <= steps; k++) {
    const u = k / steps
    bend.push([sx * u * u * u * (u * (u * 6 - 15) + 10), 0, BEND_START + (BEND_END - BEND_START) * u])
  }
  const points: Vec3[] = [
    [0, 0, -FORK_Z],
    ...bend,
    [sx, 0, foot],
    ...[0.25, 0.5, 0.75].map((u): Vec3 => [sx, walkHeight(f, along(u)), along(u)]),
    [sx, level, top],
    [sx, level, top - 0.9],
    [sx, level, END_Z],
  ]
  // Walk the player across the bend, to where it meets the flight's line.
  let drive = 0
  for (let i = 1; i <= bend.length; i++) drive += Math.hypot(points[i][0] - points[i - 1][0], points[i][2] - points[i - 1][2])
  return {
    points: points.map(([x, y, z]): Vec3 => [x, y, z + FORK_Z]),
    end: { x: sx, y: level, z: END_Z + FORK_Z, yaw: 0 },
    drive,
    driveTime: STEP_ACROSS_TIME,
  }
}

export interface StairwellLayout {
  boxes: BoxSpec[]
  treads: InstanceTransform[]
  balusters: InstanceTransform[]
  towerPosts: InstanceTransform[]
  supports: InstanceTransform[]
  standing: LanternPlacement[]
  hanging: LanternPlacement[]
  newel: LanternPlacement[]
  roof: { position: Vec3; size: Vec3 }
  railings: { position: Vec3; length: number }[]
}

export function buildStairwellLayout(p: StairwellParams): StairwellLayout {
  const phase = phaseStream(p.seed)
  const boxes: BoxSpec[] = []
  const treads: InstanceTransform[] = []
  const balusters: InstanceTransform[] = []
  const supports: InstanceTransform[] = []
  const standing: LanternPlacement[] = []

  // The deck: edge beams and cross beams under the boards, piers into the void.
  boxes.push(
    { size: [0.14, 0.4, DECK_LENGTH], position: [-DH + 0.07, -0.24, -DECK_LENGTH / 2] },
    { size: [0.14, 0.4, DECK_LENGTH], position: [DH - 0.07, -0.24, -DECK_LENGTH / 2] },
  )
  for (const z of [-0.6, -DECK_LENGTH + 0.6]) {
    boxes.push({ size: [DECK_WIDTH, 0.22, 0.22], position: [0, -0.55, z] })
    for (const sx of [-1, 1]) supports.push({ position: [sx * (DH - 0.4), -0.66 - SUPPORT[1], z] })
  }
  // A newel post between the two flights, where they part.
  const gap = FLIGHT_X - FLIGHT_WIDTH / 2
  boxes.push(
    { size: [0.14, NEWEL_HEIGHT, 0.14], position: [0, NEWEL_HEIGHT / 2, FOOT_Z + 0.07], grain: 1 },
    { size: [gap * 2, 0.08, 0.1], position: [0, RAIL_HEIGHT, FOOT_Z + 0.07] },
  )

  for (const rise of [1, -1] as const) {
    const f = flightOf(p, rise)
    addFlight({ treads, boxes }, f)
    const level = landingHeight(f)
    const foot = walkFoot(f)
    const top = walkTop(f)
    const zMid = (foot + top) / 2
    const run = Math.abs(top - foot)
    const height = RISERS * STAIR_RISER
    const outward = Math.sign(f.x)

    for (const side of [-1, 1]) {
      const x = f.x + side * (FLIGHT_WIDTH / 2 - RAIL[0] / 2)
      // Handrail along the flight, and balusters on every third tread.
      boxes.push({
        size: [RAIL[0], RAIL[1], Math.hypot(run, height)],
        position: [x, walkHeight(f, zMid) + RAIL_HEIGHT, zMid],
        pitch: rise * Math.atan2(height, run),
        grain: 2,
      })
      for (let k = 1; k < RISERS; k += 3) {
        balusters.push({ position: [x, f.y + rise * k * STAIR_RISER, f.z - (k - 0.5) * STAIR_TREAD] })
      }
      // The landing's rails, balusters at both ends, and posts holding it up from the void.
      const z0 = landingStart(f)
      boxes.push({ size: [RAIL[0], RAIL[1], z0 - END_Z], position: [x, level + RAIL_HEIGHT, (z0 + END_Z) / 2], grain: 2 })
      balusters.push({ position: [x, level, END_Z + 0.05] })
      for (const z of [z0 - 0.15, END_Z + 0.15]) {
        supports.push({ position: [f.x + side * (FLIGHT_WIDTH / 2 - 0.1), level - LANDING_SLAB - SUPPORT[1], z] })
      }
    }
    const z0 = landingStart(f)
    boxes.push({
      size: [FLIGHT_WIDTH + 0.2, LANDING_SLAB, z0 - END_Z],
      position: [f.x, level - LANDING_SLAB / 2, (z0 + END_Z) / 2],
    })
    // A lantern on the far outer corner of each landing, to draw the eye up and down.
    standing.push({ position: [f.x + outward * 0.5, level, END_Z + 0.4], phase: phase() })
  }

  // The tower: four tall posts, beams round the top, a tie beam over the fork, one roof over it all.
  const towerPosts: InstanceTransform[] = []
  for (const sx of [-1, 1]) {
    for (const z of [-0.1, END_Z + 0.1]) towerPosts.push({ position: [sx * TOWER_POST_X, TOWER_POST_BASE, z] })
    boxes.push({ size: [0.2, 0.2, -END_Z], position: [sx * TOWER_POST_X, TIE_Y, END_Z / 2] })
  }
  for (const z of [-0.1, END_Z + 0.1, -FORK_Z - 0.6]) {
    boxes.push({ size: [TOWER_POST_X * 2 + 0.2, 0.16, 0.16], position: [0, TIE_Y, z] })
  }

  // Floor lanterns at the deck's near corners.
  for (const sx of [-1, 1]) standing.push({ position: [sx * (DH - 0.4), 0, -0.45], phase: phase() })

  return {
    boxes,
    treads,
    balusters,
    towerPosts,
    supports,
    standing,
    hanging: [{ position: [0, FORK_LANTERN_Y, -FORK_Z - 0.6], phase: phase() }],
    newel: [{ position: [0, NEWEL_HEIGHT, FOOT_Z + 0.07], phase: phase() }],
    roof: { position: [0, TOWER_TOP, END_Z / 2], size: [DECK_WIDTH + 2.2, 1.9, -END_Z] },
    railings: [-1, 1].map((sx) => ({ position: [sx * DH, 0, -DECK_LENGTH / 2] as Vec3, length: DECK_LENGTH - 0.2 })),
  }
}
