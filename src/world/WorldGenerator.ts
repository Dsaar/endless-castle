import { createRandom, hashSeed, pickWeighted } from '../lib/random'
import { placeSegment, type Segment, type SegmentDefinition, type SegmentKind } from './segment'
import { gateDefinition } from './segments/gate/definition'
import { SEGMENT_DEFINITIONS, SEGMENT_WEIGHTS, type RandomSegmentKind } from './segments/registry'
import { WorldPath } from './WorldPath'

/** Segments kept mounted ahead of the one the player is in… */
export const SEGMENTS_AHEAD = 3
/** …and at least this much walk ahead (short rooms come in runs). */
export const MIN_DISTANCE_AHEAD = 32
/** Segments kept mounted behind. */
export const SEGMENTS_BEHIND = 1
/** Segments remembered (as data, not mounted) behind the mounted window, so walking back works. */
export const SEGMENT_HISTORY = 24
/** The window grows as soon as it must, but only shrinks once the player is this far past (meters). */
const HYSTERESIS = 1.5

export interface WorldGeneratorOptions {
  /** Dev: when it returns a kind, every new segment is that kind. */
  forcedKind?: () => RandomSegmentKind | null
}

/**
 * Generates the endless castle one segment at a time, from a seed. Segment `id`'s random
 * variations come from `hash(seed, id)`, so a seed always builds the same castle.
 *
 * Starts with the Gate. Each new segment's start is the previous one's end. `update(progress)`
 * keeps at least SEGMENTS_AHEAD segments (and MIN_DISTANCE_AHEAD meters) generated ahead of the
 * player, works out which segments should be mounted (`first` … `last`, ids), and forgets old
 * ones. Pure logic: `World` mounts the window.
 */
export class WorldGenerator {
  /** Remembered segments, oldest first. Ids are consecutive. */
  readonly segments: Segment[] = []
  readonly path: WorldPath
  /** Mounted window and the segment the player is in, as ids. */
  first = 0
  last = 0
  current = 0

  readonly seed: number
  private readonly options: WorldGeneratorOptions

  constructor(seed: number, options: WorldGeneratorOptions = {}) {
    this.seed = seed
    this.options = options
    this.path = new WorldPath(this.segments)
    this.segments.push(placeSegment(gateDefinition, null, 0, { x: 0, y: 0, z: 0, yaw: 0 }, 0))
  }

  /** A remembered segment by id, or undefined once forgotten / not yet generated. */
  byId(id: number): Segment | undefined {
    return this.segments[id - this.segments[0].id]
  }

  /** Call whenever progress changes. Cheap when nothing needs to change (no allocations). */
  update(progress: number) {
    const path = this.path
    while (
      this.segments.length - 1 - path.indexAt(progress) < SEGMENTS_AHEAD ||
      path.end - progress < MIN_DISTANCE_AHEAD
    ) {
      this.generate()
    }

    // Grow the window at once; shrink it only once the player is HYSTERESIS past the boundary,
    // so pacing back and forth over a boundary doesn't mount and unmount the same segment.
    const lastNow = this.lastWanted(progress)
    if (lastNow > this.last) this.last = lastNow
    else this.last = Math.min(this.last, this.lastWanted(progress + HYSTERESIS))
    const firstNow = this.firstWanted(progress)
    if (firstNow < this.first) this.first = firstNow
    else this.first = Math.max(this.first, this.firstWanted(progress - HYSTERESIS))

    const offset = this.segments[0].id
    this.current = offset + path.indexAt(progress)

    // Forget segments far behind the window.
    let drop = 0
    while (this.segments[drop].id < this.first - SEGMENT_HISTORY) drop++
    if (drop > 0) {
      this.segments.splice(0, drop)
      this.path.shifted(drop)
    }
  }

  /** Last id to mount for `progress`: SEGMENTS_AHEAD past the current one, and MIN_DISTANCE_AHEAD of walk. */
  private lastWanted(progress: number) {
    const list = this.segments
    let i = Math.min(this.path.indexAt(progress) + SEGMENTS_AHEAD, list.length - 1)
    while (i < list.length - 1 && list[i].startDistance + list[i].length < progress + MIN_DISTANCE_AHEAD) i++
    return list[0].id + i
  }

  /** First id to mount for `progress`: SEGMENTS_BEHIND before the current one. */
  private firstWanted(progress: number) {
    return this.segments[0].id + Math.max(0, this.path.indexAt(progress) - SEGMENTS_BEHIND)
  }

  private generate() {
    const previous = this.segments[this.segments.length - 1]
    const id = previous.id + 1
    const rand = createRandom(hashSeed(this.seed, id))
    const forced = this.options.forcedKind?.() ?? null
    const startDistance = previous.startDistance + previous.length
    const previousDef: SegmentDefinition<unknown> =
      previous.kind === 'gate' ? gateDefinition : SEGMENT_DEFINITIONS[previous.kind]

    // Continue a run (nearly identical rooms), or pick a fresh kind.
    const continuing =
      previousDef.follow !== undefined &&
      (forced === previous.kind || (forced === null && previousDef.continues?.(previous.params) === true))
    if (continuing && previousDef.follow) {
      const params = previousDef.follow(previous.params, rand)
      this.segments.push(placeSegment(previousDef, params, id, previous.end, startDistance))
      return
    }

    const kind = forced ?? (id === 1 ? 'threshold' : pickKind(rand, previous.kind))
    const definition = SEGMENT_DEFINITIONS[kind]
    const params = definition.generate(rand, { id, previous, heading: previous.end.yaw })
    this.segments.push(placeSegment(definition, params, id, previous.end, startDistance))
  }
}

/** A weighted pick that never repeats the previous kind (runs are handled separately). */
function pickKind(rand: () => number, previous: SegmentKind): RandomSegmentKind {
  const weights: Partial<Record<RandomSegmentKind, number>> = { ...SEGMENT_WEIGHTS }
  if (previous !== 'gate') delete weights[previous]
  return pickWeighted(rand, weights)
}
