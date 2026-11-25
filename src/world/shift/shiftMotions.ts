import { chance, pick, randRange, type Random } from '../../lib/random'
import type { Vec3 } from '../../scene/kit/types'
import type { Segment } from '../segment'
import type { SegmentMotion } from './segmentMotion'

/**
 * How each room moves in a room shift, in world space. A room leaving slides off sideways,
 * swings down on a hinge at its near end like a trapdoor, or drops into the void. A new room
 * slides in from the side, swings up from below on the same hinge, rises out of the dark or
 * comes down from above. Every move ends exactly at rest, at the room's own joint, so the walk
 * stays whole.
 */

const UP: Vec3 = [0, 1, 0]

/** The level unit vectors to the right of and ahead of a heading (yaw 0 faces -Z). */
function frameOf(yaw: number) {
  const right: Vec3 = [Math.cos(yaw), 0, -Math.sin(yaw)]
  const forward: Vec3 = [-Math.sin(yaw), 0, -Math.cos(yaw)]
  return { right, forward }
}

function startOf(s: Segment): Vec3 {
  return [s.start.x, s.start.y, s.start.z]
}

function middleOf(s: Segment): Vec3 {
  return [(s.start.x + s.end.x) / 2, (s.start.y + s.end.y) / 2, (s.start.z + s.end.z) / 2]
}

function along(v: Vec3, k: number, extra: Vec3 = [0, 0, 0]): Vec3 {
  return [v[0] * k + extra[0], v[1] * k + extra[1], v[2] * k + extra[2]]
}

/** The move of a room leaving the walk (and of the previews of its fork, which go with it). */
export function departMotion(s: Segment, rand: Random, shift: number, delay: number): SegmentMotion {
  const { right, forward } = frameOf(s.start.yaw)
  const side = chance(rand, 0.5) ? -1 : 1
  const base = { shift, kind: 'depart' as const, delay }
  switch (pick(rand, ['slide', 'hinge', 'drop'] as const)) {
    case 'slide':
      return { ...base, pivot: startOf(s), axis: UP, angle: side * randRange(rand, 0.25, 0.45), offset: along(right, side * 34, [0, -10, 0]) }
    case 'hinge':
      return { ...base, pivot: startOf(s), axis: right, angle: -randRange(rand, 1.1, 1.4), offset: [0, -24, 0] }
    case 'drop':
      return { ...base, pivot: middleOf(s), axis: forward, angle: side * randRange(rand, 0.12, 0.3), offset: [0, -80, 0] }
  }
}

/** The move of a new room arriving: where it comes from, played back to rest. */
export function arriveMotion(s: Segment, rand: Random, shift: number, delay: number): SegmentMotion {
  const { right, forward } = frameOf(s.start.yaw)
  const side = chance(rand, 0.5) ? -1 : 1
  const base = { shift, kind: 'arrive' as const, delay }
  switch (pick(rand, ['slide', 'hinge', 'rise', 'descend'] as const)) {
    case 'slide':
      return { ...base, pivot: startOf(s), axis: UP, angle: -side * randRange(rand, 0.2, 0.4), offset: along(right, side * 30, [0, -6, 0]) }
    case 'hinge':
      return { ...base, pivot: startOf(s), axis: right, angle: -randRange(rand, 1.2, 1.45), offset: [0, -6, 0] }
    case 'rise':
      return { ...base, pivot: middleOf(s), axis: forward, angle: side * randRange(rand, 0.1, 0.25), offset: [0, -45, 0] }
    case 'descend':
      return { ...base, pivot: middleOf(s), axis: forward, angle: side * randRange(rand, 0.08, 0.18), offset: [0, 32, 0] }
  }
}

/**
 * The room you stand in lurches about where you stand: a jolt sideways and down with a slight
 * turn, then back into place. You stay put on the walk, so the room moves around you.
 */
export function lurchMotion(at: Vec3, yaw: number, rand: Random, shift: number, size: { side: number; drop: number; turn: number }): SegmentMotion {
  const { right } = frameOf(yaw)
  const side = chance(rand, 0.5) ? -1 : 1
  return {
    shift,
    kind: 'lurch',
    pivot: at,
    axis: UP,
    angle: side * size.turn,
    offset: along(right, side * size.side, [0, -size.drop, 0]),
    delay: 0,
  }
}
