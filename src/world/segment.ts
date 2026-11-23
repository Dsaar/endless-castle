import { CatmullRomCurve3, LineCurve3, Vector3, type Curve } from 'three'
import type { ReactNode } from 'react'
import type { Random } from '../lib/random'
import type { Vec3 } from '../scene/kit/types'

/** Every kind of segment the castle is built from. */
export type SegmentKind = 'gate' | 'threshold' | 'fall' | 'walkway' | 'corridor' | 'gallery' | 'tatami'

/**
 * A place and a facing at floor level. `yaw` 0 faces -Z; positive turns left (toward -X),
 * the same convention as the player's camera.
 */
export interface SegmentTransform {
  x: number
  y: number
  z: number
  yaw: number
}

export interface SegmentProps<P> {
  segment: Segment<P>
}

/**
 * The React component that builds a segment, in its local frame (start at the origin,
 * facing -Z). Typed with the "bivariance hack" so a `Segment<CorridorParams>` can sit in a
 * list of `Segment<unknown>` while its component still sees typed params.
 */
export type SegmentComponent<P> = { bivarianceHack(props: SegmentProps<P>): ReactNode }['bivarianceHack']

/** One piece of the endless castle, placed in the world. */
export interface Segment<P = unknown> {
  /** Order of generation: the Gate is 0, then 1, 2, 3… Also the room number. */
  id: number
  kind: SegmentKind
  /** Shown to the player as where they are, e.g. "The Shoji Corridor". */
  area: string
  kanji: string
  /** Length of the walk through it, in meters. */
  length: number
  /** Distance along the whole walk where this segment's path begins. */
  startDistance: number
  /** Where its local frame sits in the world: the previous segment's `end`. */
  start: SegmentTransform
  /** Where the next segment attaches, in world space. */
  end: SegmentTransform
  /** The camera path at floor level, in world space; arc length 0 … `length`. */
  path: Curve<Vector3>
  /** This copy's random variations. */
  params: P
  Component: SegmentComponent<P>
}

/** A segment's shape in its own frame, worked out from its params. */
export interface SegmentPlan {
  /**
   * The walk at floor level, in local space: two points for a straight walk, more for a
   * curve (centripetal Catmull-Rom). It should start at the origin heading -Z, and end at
   * `end` heading along `end.yaw`, so neighbours join with matching tangents.
   */
  points: readonly Vec3[]
  /** Where the next segment attaches, in local space. */
  end: SegmentTransform
}

/** What a definition can see when it picks the next segment's variations. */
export interface SegmentContext {
  /** The new segment's id. */
  id: number
  /** The segment it attaches to. */
  previous: Segment
  /** World yaw at its start (the previous segment's end yaw). */
  heading: number
}

/** A kind of segment: how to vary it, how to lay it out, and how to build it. */
export interface SegmentDefinition<P> {
  kind: SegmentKind
  area: string
  kanji: string
  /** Picks a fresh copy's random variations. */
  generate(rand: Random, context: SegmentContext): P
  /** Its walk and its exit, from its params. Pure. */
  plan(params: P): SegmentPlan
  Component: SegmentComponent<P>
  /**
   * Runs: when the previous segment is this kind and `continues` says so, the next one is
   * `follow(previous)` instead of a fresh pick (the Tatami Room's nearly identical rooms).
   */
  continues?(previous: P): boolean
  follow?(previous: P, rand: Random): P
}

/** Local → world, for a frame placed at `t`. */
export function toWorld(t: SegmentTransform, [x, y, z]: Vec3, target = new Vector3()) {
  const c = Math.cos(t.yaw)
  const s = Math.sin(t.yaw)
  return target.set(t.x + x * c + z * s, t.y + y, t.z - x * s + z * c)
}

/** Places a definition's plan at `start` and returns the finished segment. */
export function placeSegment<P>(
  definition: SegmentDefinition<P>,
  params: P,
  id: number,
  start: SegmentTransform,
  startDistance: number,
): Segment<P> {
  const plan = definition.plan(params)
  const points = plan.points.map((p) => toWorld(start, p))
  const path: Curve<Vector3> =
    points.length === 2 ? new LineCurve3(points[0], points[1]) : new CatmullRomCurve3(points, false, 'centripetal')
  // A finer arc-length table than the default 200, for long curved walks.
  path.arcLengthDivisions = Math.max(200, Math.ceil(points.length * 40))
  const endPos = toWorld(start, [plan.end.x, plan.end.y, plan.end.z])
  return {
    id,
    kind: definition.kind,
    area: definition.area,
    kanji: definition.kanji,
    length: path.getLength(),
    startDistance,
    start,
    end: { x: endPos.x, y: endPos.y, z: endPos.z, yaw: start.yaw + plan.end.yaw },
    path,
    params,
    Component: definition.Component,
  }
}

/** A straight walk of `length` meters down -Z, for `SegmentPlan`s. */
export function straightPlan(length: number): SegmentPlan {
  return { points: [[0, 0, 0], [0, 0, -length]], end: { x: 0, y: 0, z: -length, yaw: 0 } }
}
