import { CatmullRomCurve3, Vector3 } from 'three'
import { chance, randInt, randRange, type Random } from '../../../lib/random'
import { CORD_BASE } from '../../../scene/kit/lanternGeometry'
import type { LanternPlacement } from '../../../scene/kit/LanternInstances'
import type { InstanceTransform, Vec3 } from '../../../scene/kit/types'
import { generatePavilion, type PavilionSpec } from '../../pieces/pavilionLayout'
import type { SegmentContext, SegmentPlan } from '../../segment'
import { phaseStream } from '../common'

const DEG = Math.PI / 180

export const WALKWAY_WIDTH = 1.6
/** Straight run-in and run-out, so the walk joins its neighbours with matching tangents. */
const LEAD = 1.5
/** The castle never wanders further than this from the Gate's heading. */
const MAX_HEADING = 50 * DEG

// Piece sizes (meters).
export const PLANK: Vec3 = [WALKWAY_WIDTH, 0.05, 0.22]
const PLANK_PITCH = 0.25
export const STRINGER: Vec3 = [0.1, 0.2, 1.02]
const STRINGER_PITCH = 0.95
const STRINGER_X = 0.68
export const RAIL_POST: Vec3 = [0.07, 0.9, 0.07]
const RAIL_POST_X = 0.74
const RAIL_BAY = 1.5
/** Pieces that stand up keep this far inside the segment's ends, clear of the neighbour's walls. */
const END_INSET = 0.06
export const RAIL: Vec3 = [0.05, 0.05, RAIL_BAY]
export const LANTERN_POST: Vec3 = [0.13, 2.75, 0.13]
const LANTERN_POST_X = 0.92
export const ARM: Vec3 = [0.62, 0.07, 0.07]
export const CORD: Vec3 = [0.022, 40, 0.022]
export const LANTERN_SIZE = 1.1
export const LANTERN_CORD = 0.35
const LANTERN_X = 0.62

export interface WalkwayParams {
  /** Length of the walk before it is smoothed (meters). */
  length: number
  /** Total change of heading from start to end (radians, + turns left). */
  turn: number
  /** A gentle S-bend on top of the turn: peak heading wobble (radians). */
  sway: number
  /** How high the middle rises above the ends (meters). 0 is flat. */
  arch: number
  /** Distance between lantern posts. */
  spacing: number
  /** Lantern posts in pairs, or alternating sides. */
  bothSides: boolean
  /** Side of the first lantern post (-1 left, 1 right). */
  firstSide: -1 | 1
  pavilions: PavilionSpec[]
  seed: number
}

type PathParams = Pick<WalkwayParams, 'length' | 'turn' | 'sway' | 'arch'>

/** Heading (radians) and height (meters) `s` meters along the walk, before smoothing. */
function shape(p: PathParams, s: number) {
  const span = p.length - LEAD * 2
  const u = Math.min(1, Math.max(0, (s - LEAD) / span))
  const ease = u * u * (3 - 2 * u)
  const bump = Math.sin(Math.PI * u) ** 2
  return {
    heading: p.turn * ease + p.sway * Math.sin(Math.PI * 2 * u) * bump,
    height: p.arch * bump,
  }
}

/**
 * The walk's control points, in the segment's frame: integrated from the heading and height
 * curves, with straight leads at both ends so its tangents match its neighbours exactly.
 */
export function walkwayPlan(p: PathParams): SegmentPlan {
  const STEP = 0.1
  const marks = [0, LEAD]
  for (let s = LEAD + 2; s < p.length - LEAD - 0.8; s += 2) marks.push(s)
  marks.push(p.length - LEAD, p.length)

  const points: Vec3[] = []
  let x = 0
  let z = 0
  let s = 0
  let next = 0
  while (next < marks.length) {
    if (s >= marks[next] - 1e-6) {
      points.push([x, shape(p, s).height, z])
      next++
      continue
    }
    // Midpoint rule, so the integrated heading matches the curve closely.
    const h = shape(p, s + STEP / 2).heading
    x -= Math.sin(h) * STEP
    z -= Math.cos(h) * STEP
    s += STEP
  }
  const end = points[points.length - 1]
  return { points, end: { x: end[0], y: 0, z: end[2], yaw: p.turn } }
}

/** The walk as a local curve (same points as the plan), for laying pieces along it. */
export function walkwayCurve(p: PathParams) {
  return new CatmullRomCurve3(
    walkwayPlan(p).points.map(([x, y, z]) => new Vector3(x, y, z)),
    false,
    'centripetal',
  )
}

interface Frame {
  point: Vector3
  yaw: number
  pitch: number
  /** Unit vector to the right of the walking direction, level. */
  rightX: number
  rightZ: number
}

function frameAt(curve: CatmullRomCurve3, length: number, d: number): Frame {
  const u = Math.min(1, Math.max(0, d / length))
  const point = curve.getPointAt(u)
  const t = curve.getTangentAt(u)
  const yaw = Math.atan2(-t.x, -t.z)
  return { point, yaw, pitch: Math.atan2(t.y, Math.hypot(t.x, t.z)), rightX: Math.cos(yaw), rightZ: -Math.sin(yaw) }
}

/** A point `side × offset` to the right of the walk, `lift` above it. */
function beside(f: Frame, side: number, offset: number, lift: number): Vec3 {
  return [f.point.x + f.rightX * side * offset, f.point.y + lift, f.point.z + f.rightZ * side * offset]
}

/**
 * A point `offset` meters to one side of the walk (`side` -1 left, 1 right), `share` of the way
 * along it and `lift` above it, with the walk's heading there. For placing things off the walk.
 */
export function besideWalkway(p: PathParams, share: number, side: number, offset: number, lift: number) {
  const curve = walkwayCurve(p)
  const length = curve.getLength()
  const f = frameAt(curve, length, length * share)
  return { position: beside(f, side, offset, lift), yaw: f.yaw }
}

export function generateWalkway(rand: Random, context: SegmentContext): WalkwayParams {
  const path: PathParams = {
    length: randRange(rand, 16, 28),
    turn: randRange(rand, -25, 25) * DEG,
    sway: randRange(rand, -0.22, 0.22),
    arch: chance(rand, 0.65) ? randRange(rand, 0.3, 0.8) : 0,
  }
  // Steer back toward the castle's axis (the Gate's heading, turned at each fork taken) rather
  // than wander off sideways for good.
  const drift = context.heading - context.axis
  if (Math.abs(drift + path.turn) > MAX_HEADING) path.turn = -Math.sign(drift) * Math.abs(path.turn)

  // Floating pavilions, well clear of the walk on either side, above and below it.
  const curve = walkwayCurve(path)
  const length = curve.getLength()
  const pavilions: PavilionSpec[] = []
  const count = randInt(rand, 2, 4)
  for (let i = 0; i < count; i++) {
    const f = frameAt(curve, length, length * randRange(rand, 0.1, 0.9))
    const side = i % 2 === 0 ? -1 : 1
    pavilions.push(generatePavilion(rand, beside(f, side, randRange(rand, 10, 24), randRange(rand, -7, 4))))
  }

  return {
    ...path,
    spacing: randRange(rand, 3.5, 5.5),
    bothSides: chance(rand, 0.35),
    firstSide: chance(rand, 0.5) ? -1 : 1,
    pavilions,
    seed: randInt(rand, 1, 999_999),
  }
}

export interface WalkwayLayout {
  planks: InstanceTransform[]
  stringers: InstanceTransform[]
  railPosts: InstanceTransform[]
  rails: InstanceTransform[]
  lanternPosts: InstanceTransform[]
  arms: InstanceTransform[]
  cords: InstanceTransform[]
  lanterns: LanternPlacement[]
}

/** Every piece laid along the curve: planks follow its slope, posts stand upright. */
export function buildWalkwayLayout(p: WalkwayParams): WalkwayLayout {
  const curve = walkwayCurve(p)
  const length = curve.getLength()
  const at = (d: number) => frameAt(curve, length, d)
  const phase = phaseStream(p.seed)
  const out: WalkwayLayout = { planks: [], stringers: [], railPosts: [], rails: [], lanternPosts: [], arms: [], cords: [], lanterns: [] }

  for (let d = PLANK_PITCH / 2; d < length; d += PLANK_PITCH) {
    const f = at(d)
    out.planks.push({ position: [f.point.x, f.point.y - PLANK[1] / 2, f.point.z], yaw: f.yaw, pitch: f.pitch })
  }
  for (let d = STRINGER_PITCH / 2; d < length; d += STRINGER_PITCH) {
    const f = at(d)
    for (const side of [-1, 1]) out.stringers.push({ position: beside(f, side, STRINGER_X, -0.16), yaw: f.yaw, pitch: f.pitch })
  }

  // Rail posts at even spacing; top and lower rails between them, with suspension cords
  // rising from every other post into the dark.
  const bays = Math.max(1, Math.round(length / RAIL_BAY))
  for (const side of [-1, 1]) {
    let prevTop: Vec3 | null = null
    let prevLow: Vec3 | null = null
    for (let k = 0; k <= bays; k++) {
      const f = at(END_INSET + (k * (length - END_INSET * 2)) / bays)
      out.railPosts.push({ position: beside(f, side, RAIL_POST_X, RAIL_POST[1] / 2), yaw: f.yaw })
      const top = beside(f, side, RAIL_POST_X, RAIL_POST[1] - 0.03)
      const low = beside(f, side, RAIL_POST_X, 0.42)
      if (prevTop && prevLow) {
        out.rails.push(span(prevTop, top))
        out.rails.push(span(prevLow, low))
      }
      if (k % 2 === 0) out.cords.push({ position: beside(f, side, RAIL_POST_X, RAIL_POST[1]) })
      prevTop = top
      prevLow = low
    }
  }

  // Lantern posts outside the rail, each with an arm reaching in over the walk.
  let side = p.firstSide
  for (let d = p.spacing / 2; d < length - 1; d += p.spacing) {
    const f = at(d)
    for (const s of p.bothSides ? [-1, 1] : [side]) {
      const base = beside(f, s, LANTERN_POST_X, 0)
      out.lanternPosts.push({ position: base, yaw: f.yaw })
      out.arms.push({ position: beside(f, s, LANTERN_POST_X - ARM[0] / 2 + 0.05, LANTERN_POST[1] - 0.07), yaw: f.yaw })
      out.cords.push({ position: [base[0], base[1] + LANTERN_POST[1], base[2]] })
      const armBottom = LANTERN_POST[1] - 0.07 - ARM[1] / 2
      out.lanterns.push({
        position: beside(f, s, LANTERN_X, armBottom - (CORD_BASE + LANTERN_CORD) * LANTERN_SIZE),
        yaw: f.yaw,
        phase: phase(),
      })
    }
    side = side === 1 ? -1 : 1
  }
  return out
}

/** A rail from `a` to `b`: the RAIL box at their midpoint, turned and stretched to fit. */
function span(a: Vec3, b: Vec3): InstanceTransform {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const dz = b[2] - a[2]
  const flat = Math.hypot(dx, dz)
  return {
    position: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2],
    yaw: Math.atan2(-dx, -dz),
    pitch: Math.atan2(dy, flat),
    scale: [1, 1, (Math.hypot(flat, dy) + 0.03) / RAIL_BAY],
  }
}
