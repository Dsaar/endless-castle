import type { Vector3 } from 'three'
import { clamp } from '../lib/math'
import type { WalkPath } from '../scene/player/walkPath'
import type { Segment } from './segment'

/**
 * The whole walk: every generated segment's path, end to end, addressed by distance from
 * the start of the Gate. Each segment starts where the previous one ends, heading the same
 * way, so the joined path has no kinks. Shares the generator's segment list.
 */
export class WorldPath implements WalkPath {
  /** Index of the last segment looked up; walking mostly stays in it. */
  private cursor = 0

  private readonly segments: readonly Segment[]

  constructor(segments: readonly Segment[]) {
    this.segments = segments
  }

  /** Distance where the oldest remembered segment begins: the player can't walk back past it. */
  get start() {
    return this.segments.length ? this.segments[0].startDistance : 0
  }

  /** Distance where the newest segment ends. */
  get end() {
    const last = this.segments[this.segments.length - 1]
    return last ? last.startDistance + last.length : 0
  }

  /** Index (into the segment list) of the segment that holds `distance`, clamped to the ends. */
  indexAt(distance: number) {
    const list = this.segments
    if (list.length === 0) return -1
    let i = clamp(this.cursor, 0, list.length - 1)
    while (i > 0 && distance < list[i].startDistance) i--
    while (i < list.length - 1 && distance >= list[i].startDistance + list[i].length) i++
    this.cursor = i
    return i
  }

  getPointAt(distance: number, target: Vector3) {
    const i = this.indexAt(distance)
    if (i < 0) return target.set(0, 0, 0)
    const s = this.segments[i]
    const u = s.length > 0 ? (distance - s.startDistance) / s.length : 0
    return s.path.getPointAt(clamp(u, 0, 1), target)
  }

  /** The list was trimmed at the front; keep the cursor pointing at the same segment. */
  shifted(count: number) {
    this.cursor = Math.max(0, this.cursor - count)
  }
}
