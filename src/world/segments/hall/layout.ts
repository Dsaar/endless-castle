import { chance, pick, randInt, type Random } from '../../../lib/random'
import { CORD_BASE } from '../../../scene/kit/lanternGeometry'
import type { LanternPlacement } from '../../../scene/kit/LanternInstances'
import type { ShojiPlacement } from '../../../scene/kit/ShojiInstances'
import type { BoxSpec, InstanceTransform, Vec3 } from '../../../scene/kit/types'
import { generateHangingStairs, type HangingStairsSpec } from '../../pieces/hangingStairsLayout'
import { turnPoint, type BranchChoice, type BranchPlan, type SegmentContext, type SegmentPlan } from '../../segment'
import { BAY, HALF_BAY, phaseStream, pierPairs } from '../common'
import {
  litBays,
  shojiWall,
  WALL_HEAD,
  WALL_HEIGHT,
  WALL_KAMOI,
  WALL_PANEL,
  WALL_PANEL_SIZE,
  WALL_POST,
  WALL_SILL,
  WALL_TRANSOM,
} from '../shojiWall'

/**
 * A tall square hall where the walk divides: the Forking Hall and the Crossroads. Five bays a
 * side, a doorway in the middle bay of every wall, and on the three ways out a short covered
 * passage (a vestibule) that the next room attaches to. Shoji up to the door heads, then
 * plaster with a band of glowing clerestory lattices, and a coffered ceiling high overhead.
 */
export const HALL_BAYS = 5
export const HALL_SIZE = HALL_BAYS * BAY
const H = HALL_SIZE / 2
export const HALL_HEIGHT = 4.6
/** Wall lines stand this far inside the square, so the posts stay inside the segment. */
const INSET = WALL_POST / 2
const DOOR_BAY = 2
const CLERESTORY_Y = 3.35
const CEILING_BOARD = 0.05
/** Sliding doors run in a track this far inside the wall line, clear of the posts. */
export const DOOR_TRACK = 0.1

export const VESTIBULE_BAYS = 2
export const VESTIBULE_LENGTH = VESTIBULE_BAYS * BAY
export const VESTIBULE_WIDTH = 2.4
const VH = VESTIBULE_WIDTH / 2

/**
 * The walk turns about a circle this tight: it stops this far short of the middle, so a quarter
 * turn ends right on the middle of a side doorway.
 */
export const TURN_RADIUS = 0.5
/** Seconds the camera takes to turn toward a side way. */
export const TURN_TIME = 0.8
const ARC_STEPS = 18
/** Extra arc samples this close (radians) to each end, so the spline leaves and joins the straights on their tangent. */
const ARC_EDGE = 0.01

export const PIER_DEPTH = 14
export const PIER: Vec3 = [0.3, PIER_DEPTH, 0.3]
export const HALL_POST: Vec3 = [WALL_POST, HALL_HEIGHT, WALL_POST]
export const VESTIBULE_POST: Vec3 = [WALL_POST, WALL_HEIGHT, WALL_POST]
export const COFFER: Vec3 = [HALL_SIZE, 0.06, 0.06]
export const VESTIBULE_BATTEN: Vec3 = [VESTIBULE_WIDTH, 0.06, 0.05]
export const VESTIBULE_ROOF: Vec3 = [VESTIBULE_WIDTH + 1.8, 1.25, VESTIBULE_LENGTH]
export const CENTER_LANTERN_SIZE = 1.5
const CENTER_LANTERN_Y = 3.25
export const CENTER_LANTERN_CORD = (HALL_HEIGHT - CENTER_LANTERN_Y) / CENTER_LANTERN_SIZE - CORD_BASE
export const VESTIBULE_LANTERN_SIZE = 0.95
export const VESTIBULE_LANTERN_CORD = 0.12

/** The four sides of the hall, and the turn (about the hall's middle) from the far wall to each. */
export type HallSide = 'entry' | 'left' | 'straight' | 'right'
export const HALL_SIDES: readonly HallSide[] = ['entry', 'left', 'straight', 'right']
const SIDE_YAW: Record<HallSide, number> = { straight: 0, left: Math.PI / 2, right: -Math.PI / 2, entry: Math.PI }
export const HALL_EXITS: readonly BranchChoice[] = ['left', 'straight', 'right']

export interface HallParams {
  /** Which bays of each wall glow, in `HALL_SIDES` order (5 each). */
  lit: boolean[][]
  /** The clerestory band: every lattice lit, or every other one. */
  clerestory: 'all' | 'alternate'
  /** Floor lanterns in the four corners. */
  corners: boolean[]
  /** A flight hanging upside down from the ceiling, or none. Always there after a Stairwell. */
  hanging: HangingStairsSpec | null
  seed: number
}

/** The hall's middle, in its own frame. */
export const HALL_CENTER: Vec3 = [0, 0, -H]

export function generateHall(rand: Random, context: SegmentContext): HallParams {
  const pattern = pick(rand, ['all', 'all', 'alternate', 'sparse'] as const)
  const lit = HALL_SIDES.map((_, i) => litBays(rand, HALL_BAYS, pattern, i))
  const clerestory = chance(rand, 0.6) ? 'all' : 'alternate'
  const corners = [0, 1, 2, 3].map(() => chance(rand, 0.8))
  const hangingRoll = chance(rand, 0.45)
  const hanging = context.afterStairs || hangingRoll ? generateHangingStairs(rand, HALL_CENTER, HALL_SIZE) : null
  return { lit, clerestory, corners, hanging, seed: randInt(rand, 1, 999_999) }
}

/** The walk in: from the entry doorway to just short of the middle, where it divides. */
export function hallPlan(): SegmentPlan {
  const z = -(H - TURN_RADIUS)
  return { points: [[0, 0, 0], [0, 0, z]], end: { x: 0, y: 0, z, yaw: 0 } }
}

/**
 * The walk out along `choice`, from the fork point (the hall's middle is TURN_RADIUS ahead).
 * Straight on is a straight line through the far doorway. A side way turns a tight quarter
 * circle (walked for the player in TURN_TIME, so the camera swings round to the doorway),
 * then runs straight out through the side vestibule.
 */
export function hallBranch(choice: BranchChoice): BranchPlan {
  const out = H + VESTIBULE_LENGTH
  if (choice === 'straight') {
    const z = -(TURN_RADIUS + out)
    return { points: [[0, 0, 0], [0, 0, z]], end: { x: 0, y: 0, z, yaw: 0 }, drive: 0, driveTime: 0 }
  }
  const side = choice === 'left' ? -1 : 1
  const r = TURN_RADIUS
  const angles = [0, ARC_EDGE]
  for (let k = 1; k < ARC_STEPS; k++) angles.push((k / ARC_STEPS) * (Math.PI / 2))
  angles.push(Math.PI / 2 - ARC_EDGE, Math.PI / 2)
  const points: Vec3[] = angles.map((a): Vec3 => [side * r * (1 - Math.cos(a)), 0, -r * Math.sin(a)])
  // A sample just past the arc, then evenly spaced points keep the straight run straight.
  points.push([side * (r + r * ARC_EDGE), 0, -r])
  const runs = Math.ceil((out - r) / 1.5)
  for (let k = 1; k <= runs; k++) points.push([side * (r + ((out - r) * k) / runs), 0, -r])
  return {
    points,
    end: { x: side * out, y: 0, z: -r, yaw: -side * (Math.PI / 2) },
    drive: (Math.PI / 2) * r,
    driveTime: TURN_TIME,
  }
}

export interface FloorSpec {
  position: Vec3
  yaw: number
  size: [number, number]
}

export interface DoorwaySpec {
  side: HallSide
  /** Middle of the sliding doors' track, at floor level. */
  position: Vec3
  yaw: number
}

export interface HallLayout {
  posts: InstanceTransform[]
  vestibulePosts: InstanceTransform[]
  boxes: BoxSpec[]
  plaster: BoxSpec[]
  panels: ShojiPlacement[]
  transoms: ShojiPlacement[]
  coffers: InstanceTransform[]
  battens: InstanceTransform[]
  piers: InstanceTransform[]
  floors: FloorSpec[]
  roof: { position: Vec3; size: Vec3 }
  vestibuleRoofs: InstanceTransform[]
  standing: LanternPlacement[]
  center: LanternPlacement[]
  vestibuleLanterns: LanternPlacement[]
  doorways: DoorwaySpec[]
}

/** Pieces laid out for the far wall and its vestibule, relative to the hall's middle, then turned to each side. */
class Placer {
  yaw = 0
  private readonly layout: HallLayout
  constructor(layout: HallLayout) {
    this.layout = layout
  }

  point(p: Vec3): Vec3 {
    const [x, y, z] = turnPoint(p, this.yaw)
    return [x + HALL_CENTER[0], y + HALL_CENTER[1], z + HALL_CENTER[2]]
  }
  box(list: BoxSpec[], b: BoxSpec) {
    list.push({ ...b, position: this.point(b.position), yaw: (b.yaw ?? 0) + this.yaw })
  }
  item(list: InstanceTransform[], t: InstanceTransform) {
    list.push({ ...t, position: this.point(t.position), yaw: (t.yaw ?? 0) + this.yaw })
  }
  panel(list: ShojiPlacement[], p: ShojiPlacement) {
    list.push({ ...p, position: this.point(p.position), yaw: (p.yaw ?? 0) + this.yaw })
  }
  get out() {
    return this.layout
  }
}

export function buildHallLayout(p: HallParams): HallLayout {
  const phase = phaseStream(p.seed)
  const layout: HallLayout = {
    posts: [],
    vestibulePosts: [],
    boxes: [],
    plaster: [],
    panels: [],
    transoms: [],
    coffers: [],
    battens: [],
    piers: [],
    floors: [],
    roof: { position: [0, HALL_HEIGHT + CEILING_BOARD, -H], size: [HALL_SIZE + 1.6, 2.6, HALL_SIZE] },
    vestibuleRoofs: [],
    standing: [],
    center: [],
    vestibuleLanterns: [],
    doorways: [],
  }
  const place = new Placer(layout)

  HALL_SIDES.forEach((side, i) => {
    place.yaw = SIDE_YAW[side]
    addWall(place, p.lit[i], p.clerestory)
    layout.doorways.push({ side, position: place.point([0, WALL_SILL, -(H - INSET) + DOOR_TRACK]), yaw: place.yaw })
    if (side !== 'entry') addVestibule(place, phase)
  })

  // Corner posts, full height.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) layout.posts.push({ position: [sx * (H - INSET), 0, -H + sz * (H - INSET)] })

  // Floor, base, ceiling.
  layout.floors.push({ position: [0, 0, -H], yaw: 0, size: [HALL_SIZE, HALL_SIZE] })
  layout.boxes.push(
    { size: [HALL_SIZE, 0.3, HALL_SIZE], position: [0, -0.205, -H] },
    { size: [HALL_SIZE, CEILING_BOARD, HALL_SIZE], position: [0, HALL_HEIGHT + CEILING_BOARD / 2, -H] },
  )
  // Coffered ceiling: a grid of ribs both ways, every half bay.
  for (let k = 1; k < HALL_BAYS * 2; k++) {
    const t = -H + k * HALF_BAY
    layout.coffers.push(
      { position: [0, HALL_HEIGHT - COFFER[1] / 2, -H + t] },
      { position: [t, HALL_HEIGHT - COFFER[1] / 2, -H], yaw: Math.PI / 2 },
    )
  }
  // Piers into the void under the corners.
  const inset = 1.2
  for (const sx of [-1, 1]) {
    for (const z of [-inset, -HALL_SIZE + inset]) layout.piers.push({ position: [sx * (H - inset), -0.355 - PIER_DEPTH, z] })
  }

  // Floor lanterns in the corners, and one big lantern hanging in the middle.
  const c = H - 0.6
  const corners: Vec3[] = [
    [-c, 0, -H + c],
    [c, 0, -H + c],
    [-c, 0, -H - c],
    [c, 0, -H - c],
  ]
  corners.forEach((position, i) => {
    const ph = phase()
    if (p.corners[i]) layout.standing.push({ position, phase: ph })
  })
  layout.center.push({ position: [0, CENTER_LANTERN_Y, -H], phase: phase() })

  return layout
}

/** The far wall (along X at the far side), as seen from the middle. Turned to each side by the placer. */
function addWall(place: Placer, lit: readonly boolean[], clerestory: HallParams['clerestory']) {
  const out = place.out
  const z = -(H - INSET)
  const [pw] = WALL_PANEL_SIZE
  const beam = (size: Vec3, y: number) => place.box(out.boxes, { size, position: [0, y, z] })
  beam([HALL_SIZE, WALL_SILL, 0.1], WALL_SILL / 2)
  beam([HALL_SIZE, WALL_KAMOI, 0.1], WALL_SILL + WALL_PANEL + WALL_KAMOI / 2)
  beam([HALL_SIZE, WALL_HEAD, 0.14], WALL_HEIGHT - WALL_HEAD / 2)
  beam([HALL_SIZE, 0.06, 0.1], CLERESTORY_Y - 0.03)
  beam([HALL_SIZE, 0.06, 0.1], CLERESTORY_Y + WALL_TRANSOM + 0.03)
  beam([HALL_SIZE, 0.14, 0.14], HALL_HEIGHT - 0.07)

  for (let i = 1; i < HALL_BAYS; i++) place.item(out.posts, { position: [-H + i * BAY, 0, z] })

  const plasterWidth = BAY - WALL_POST
  const lowBottom = WALL_HEIGHT
  const lowTop = CLERESTORY_Y - 0.06
  const highBottom = CLERESTORY_Y + WALL_TRANSOM + 0.06
  const highTop = HALL_HEIGHT - 0.14
  for (let i = 0; i < HALL_BAYS; i++) {
    const x = -H + (i + 0.5) * BAY
    if (i !== DOOR_BAY) {
      for (let k = 0; k < 2; k++) {
        place.panel(out.panels, { position: [-H + i * BAY + WALL_POST / 2 + pw * (k + 0.5), WALL_SILL, z], lit: lit[i] })
      }
    }
    place.panel(out.transoms, { position: [x, WALL_SILL + WALL_PANEL + WALL_KAMOI, z], lit: lit[i] })
    place.panel(out.transoms, { position: [x, CLERESTORY_Y, z], lit: clerestory === 'all' || i % 2 === 0 })
    place.box(out.plaster, { size: [plasterWidth, lowTop - lowBottom, 0.07], position: [x, (lowBottom + lowTop) / 2, z] })
    place.box(out.plaster, { size: [plasterWidth, highTop - highBottom, 0.07], position: [x, (highBottom + highTop) / 2, z] })
  }
}

/** The covered passage beyond the far doorway: two lit bays, open at its end, where the next room attaches. */
function addVestibule(place: Placer, phase: () => number) {
  const out = place.out
  const z0 = -H
  const L = VESTIBULE_LENGTH
  const zMid = z0 - L / 2
  const lit = Array.from({ length: VESTIBULE_BAYS }, () => true)
  for (const x of [-VH, VH]) {
    const wall = shojiWall(x, VESTIBULE_BAYS, lit)
    const shift = (v: Vec3): Vec3 => [v[0], v[1], v[2] + z0]
    for (const post of wall.posts) place.item(out.vestibulePosts, { position: shift(post.position) })
    for (const b of wall.boxes) place.box(out.boxes, { ...b, position: shift(b.position) })
    for (const panel of wall.panels) place.panel(out.panels, { ...panel, position: shift(panel.position) })
    for (const t of wall.transoms) place.panel(out.transoms, { ...t, position: shift(t.position) })
  }
  const boxes: BoxSpec[] = [
    // Board ceiling and fascias.
    { size: [VESTIBULE_WIDTH + 0.4, 0.05, L], position: [0, WALL_HEIGHT + 0.025, zMid] },
    { size: [0.06, 0.36, L], position: [-VH - 0.11, WALL_HEIGHT + 0.12, zMid] },
    { size: [0.06, 0.36, L], position: [VH + 0.11, WALL_HEIGHT + 0.12, zMid] },
    // Header over the open end.
    { size: [VESTIBULE_WIDTH, 0.24, 0.14], position: [0, WALL_HEIGHT - 0.12, z0 - L + 0.07] },
    // Edge beams under the floor.
    { size: [0.14, 0.4, L], position: [-VH + 0.07, -0.24, zMid] },
    { size: [0.14, 0.4, L], position: [VH - 0.07, -0.24, zMid] },
    { size: [VESTIBULE_WIDTH + 0.4, 0.22, 0.22], position: [0, -0.55, zMid] },
  ]
  for (const b of boxes) place.box(out.boxes, b)
  for (let k = 1; k < VESTIBULE_BAYS * 2; k++) {
    place.item(out.battens, { position: [0, WALL_HEIGHT - VESTIBULE_BATTEN[1] / 2, z0 - k * HALF_BAY] })
  }
  for (const pier of pierPairs([zMid], VH - 0.3, -0.66, PIER_DEPTH)) place.item(out.piers, pier)
  out.floors.push({ position: place.point([0, 0, zMid]), yaw: place.yaw + Math.PI / 2, size: [L, VESTIBULE_WIDTH] })
  place.item(out.vestibuleRoofs, { position: [0, WALL_HEIGHT + 0.25, zMid] })
  const y = WALL_HEIGHT - (CORD_BASE + VESTIBULE_LANTERN_CORD) * VESTIBULE_LANTERN_SIZE
  out.vestibuleLanterns.push({ position: place.point([0, y, zMid]), phase: phase() })
}
