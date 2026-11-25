import { createRandom, hashSeed, pickWeighted, randInt } from '../lib/random'
import {
  placeSegment,
  type BranchChoice,
  type BranchPreview,
  type ForkSpec,
  type Segment,
  type SegmentContext,
  type SegmentDefinition,
  type SegmentKind,
} from './segment'
import { branchDefinition, type BranchParams } from './segments/branch/definition'
import { fallDefinition } from './segments/fall/definition'
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
/** A Forking Hall is the 3rd, 4th or 5th room after the one before (after the landing, for the first). */
export const JUNCTION_GAP: readonly [min: number, max: number] = [3, 5]
/** Keeps the junction schedule's random numbers apart from the segments' own. */
const SCHEDULE_SALT = 0x6a09e667
/** Salts the random numbers of everything built after a room shift (with the shift count). */
const SHIFT_SALT = 0x3c6ef372

/**
 * The castle always opens the same way, whatever the seed or the dev panel's forced kind:
 * the Gate, a Threshold, the Fall, and the Suspended Walkway the Fall lands on.
 */
const OPENING: readonly SegmentKind[] = ['gate', 'threshold', 'fall', 'walkway']
/** The Fall's id. */
export const FALL_SEGMENT_ID = OPENING.indexOf('fall')

/** Every kind's definition, scripted ones included. */
function definitionOf(kind: SegmentKind): SegmentDefinition<unknown> {
  if (kind === 'gate') return gateDefinition
  if (kind === 'fall') return fallDefinition
  if (kind === 'branch') return branchDefinition as SegmentDefinition<unknown>
  return SEGMENT_DEFINITIONS[kind]
}

/** A segment's fork, if the walk divides there. */
export function forkOf(segment: Segment): ForkSpec<unknown> | undefined {
  return definitionOf(segment.kind).fork
}

export interface WorldGeneratorOptions {
  /** Dev: when it returns a kind, every new segment is that kind. */
  forcedKind?: () => RandomSegmentKind | null
}

/** How `next` builds one segment, beyond the usual rules. */
interface NextOptions {
  /** Build this kind (dev), whatever the schedule says. */
  kind?: RandomSegmentKind
  /** Don't continue a run of nearly identical rooms: the rooms beyond have just shifted. */
  fresh?: boolean
}

/** What a room shift took away (see `rebuildAhead`). */
export interface Rebuild {
  /** The last segment kept: the one the player is in, or the walk out of it at a fork already chosen. */
  anchor: Segment
  /** Every segment taken out of the walk after it, oldest first. */
  removed: Segment[]
}

/**
 * Generates the endless castle one segment at a time, from a seed. Segment `id`'s random
 * variations come from `hash(seed, id)`, so a seed (and the same ways chosen) always builds the
 * same castle.
 *
 * Starts with the fixed OPENING (Gate, Threshold, Fall, Suspended Walkway), then picks at
 * random. Each new segment's start is the previous one's end. `update(progress)` keeps at
 * least SEGMENTS_AHEAD segments (and MIN_DISTANCE_AHEAD meters) generated ahead of the player,
 * works out which segments should be mounted (`first` … `last`, ids), and forgets old ones.
 *
 * **Forks.** A fork (Forking Hall, Crossroads, Stairwell) ends its walk where the way divides,
 * and nothing is generated past it, so the walk ends there and the player stops. When the
 * player chooses, `resolveFork` adds the walk out along that way (a `branch` segment, part of
 * the fork's room) and generation carries on from its end. A Crossroads builds the first room
 * down each of its ways as soon as it is generated (`previews`), so every way is open and
 * real; choosing one keeps that one.
 *
 * **The junction schedule.** Every segment carries `untilJunction`: how many more rooms may
 * come before a Forking Hall must. A Forking Hall sets it to 2–4, every room after counts down,
 * and at 0 the next room is a Forking Hall. Runs of nearly identical rooms are told how many
 * rooms they may fill (`roomsAfter`), so they never make it late.
 *
 * **Room shifts.** `rebuildAhead` throws away everything past the room the player is in and
 * builds it again from a fresh random stream (salted with the number of shifts so far), starting
 * from the same joint. So the walk ahead is new but always joins on, and keeps every rule above.
 *
 * Pure logic: `World` mounts the window, `ForkDirector` asks for the choices, `ShiftDirector`
 * shifts the rooms.
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
  /**
   * The walk is held here while a room shift plays (the rooms ahead are still moving into
   * place): `World` keeps the walkable end from passing it. Infinity otherwise.
   */
  holdEnd = Number.POSITIVE_INFINITY
  /** Room shifts so far. Salts every seed and key since, so new rooms differ and never share a React key with old ones. */
  private epoch = 0
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

  /** The remembered segment that holds `progress` (clamped to the ends). */
  segmentAt(progress: number): Segment | undefined {
    const i = this.path.indexAt(progress)
    return i < 0 ? undefined : this.segments[i]
  }

  /** The fork the walk ends at, waiting for a way to be chosen, or null. */
  pendingFork(): Segment | null {
    const last = this.segments[this.segments.length - 1]
    return forkOf(last) ? last : null
  }

  /**
   * Takes `choice` at the pending fork: adds the walk out along it (and, at a Crossroads, the
   * room already built beyond). Returns the walk out, or null if there is no pending fork or it
   * doesn't offer that way. Call `update` afterward.
   */
  resolveFork(choice: BranchChoice): Segment<BranchParams> | null {
    const fork = this.pendingFork()
    const spec = fork && forkOf(fork)
    if (!fork || !spec?.choices.includes(choice)) return null
    const preview = fork.previews?.find((p) => p.choice === choice)
    const added = preview ? preview.segments : [this.branchOf(fork, choice, String(fork.id + 1))]
    for (const segment of added) this.push(segment)
    return added[0] as Segment<BranchParams>
  }

  /**
   * A room shift: takes away every segment after the one holding `progress` (after the walk out
   * of it, if it is a fork already chosen) and generates the walk ahead again from a new random
   * stream. The first new room is never the next of a run, and is `firstKind` if given (dev).
   * The new walk starts at the same joint with the same heading, so it always joins on; the
   * junction schedule and every rule of `next` carry on as before.
   *
   * Returns null when nothing ahead may change: in the opening (up to the walkway the Fall
   * lands on), or at a fork still waiting for a choice (nothing is built past it).
   */
  rebuildAhead(progress: number, firstKind?: RandomSegmentKind): Rebuild | null {
    let i = this.path.indexAt(progress)
    if (i < 0) return null
    const after = this.segments[i + 1]
    if (after?.kind === 'branch' && (after.params as BranchParams).forkId === this.segments[i].id) i++
    const anchor = this.segments[i]
    if (anchor.id < OPENING.length - 1 || i === this.segments.length - 1) return null

    const removed = this.segments.splice(i + 1)
    this.epoch++
    this.push(this.next(anchor, undefined, undefined, { kind: firstKind, fresh: true }))
    this.update(progress)
    return { anchor, removed }
  }

  /** Call whenever progress changes. Cheap when nothing needs to change (no allocations). */
  update(progress: number) {
    const path = this.path
    while (
      !this.pendingFork() &&
      (this.segments.length - 1 - path.indexAt(progress) < SEGMENTS_AHEAD || path.end - progress < MIN_DISTANCE_AHEAD)
    ) {
      this.push(this.next(this.segments[this.segments.length - 1]))
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

  /** Appends a segment; a Crossroads builds its previews as it arrives. */
  private push(segment: Segment) {
    this.segments.push(segment)
    const spec = forkOf(segment)
    if (spec?.preview && !segment.previews) {
      segment.previews = spec.choices.map((choice, i) => this.preview(segment, choice, i))
    }
  }

  /** The way out of a Crossroads along `choice`, and the room beyond, keyed so they never remount once chosen. */
  private preview(fork: Segment, choice: BranchChoice, index: number): BranchPreview {
    const branch = this.branchOf(fork, choice, `${fork.id + 1}${choice}`)
    const room = this.next(branch, this.seedFor(branch.id + 1, index + 1), `${branch.id + 1}${choice}`)
    return { choice, segments: [branch, room] }
  }

  /** The walk out of `fork` along `choice`: the fork's area, room number and schedule; its axis turned if the way turns. */
  private branchOf(fork: Segment, choice: BranchChoice, key: string): Segment {
    const plan = forkOf(fork)!.branch(fork.params, choice)
    const params: BranchParams = { forkId: fork.id, from: fork.kind, choice, plan }
    const branch = placeSegment(branchDefinition, params, fork.id + 1, fork.end, fork.startDistance + fork.length)
    branch.key = this.keyFor(key)
    branch.area = fork.area
    branch.kanji = fork.kanji
    branch.room = fork.room
    branch.untilJunction = fork.untilJunction
    branch.axis = fork.axis + plan.end.yaw
    return branch as Segment
  }

  /**
   * The segment after `previous`: the opening, a Forking Hall when one is due, the next room
   * of a run, or a weighted pick. Doesn't add it.
   */
  private next(previous: Segment, seed = this.seedFor(previous.id + 1), key?: string, options: NextOptions = {}): Segment {
    const id = previous.id + 1
    const rand = createRandom(seed)
    const forced = options.kind ?? this.options.forcedKind?.() ?? null
    // A forced kind (dev) switches the schedule off.
    const roomsAfter = forced === null ? previous.untilJunction - 1 : Number.POSITIVE_INFINITY
    const context: SegmentContext = {
      id,
      previous,
      heading: previous.end.yaw,
      axis: previous.axis,
      roomsAfter,
      afterStairs: previous.kind === 'branch' && (previous.params as BranchParams).from === 'stairwell',
    }

    let definition: SegmentDefinition<unknown>
    let params: unknown
    const opening = OPENING[id]
    if (opening !== undefined) {
      // The opening is fixed: no forced kinds, no runs.
      definition = definitionOf(opening)
      params = definition.generate(rand, context)
    } else {
      const previousDef = definitionOf(previous.kind)
      const due = forced === null && previous.untilJunction <= 0
      // Continue a run (nearly identical rooms), or pick a fresh kind.
      const continuing =
        !due &&
        !options.fresh &&
        previousDef.follow !== undefined &&
        (forced === null || forced === previous.kind) &&
        previousDef.continues?.(previous.params) === true
      if (continuing && previousDef.follow) {
        definition = previousDef
        params = previousDef.follow(previous.params, rand)
      } else {
        const kind: RandomSegmentKind = forced ?? (due ? 'junction' : pickKind(rand, previous, roomsAfter))
        definition = SEGMENT_DEFINITIONS[kind]
        params = definition.generate(rand, context)
      }
    }

    const segment = placeSegment(definition, params, id, previous.end, previous.startDistance + previous.length)
    segment.key = this.keyFor(key ?? String(id))
    segment.room = previous.room + 1
    segment.axis = previous.axis
    segment.untilJunction = this.untilJunction(segment, previous)
    return segment
  }

  /** The seed for a segment (`parts` start with its id), salted after a room shift. */
  private seedFor(...parts: number[]) {
    return this.epoch === 0 ? hashSeed(this.seed, ...parts) : hashSeed(this.seed, ...parts, SHIFT_SALT, this.epoch)
  }

  /** A React key, marked with the shift it was built in so it never matches a key from before. */
  private keyFor(base: string) {
    return this.epoch === 0 ? base : `${base}~${this.epoch}`
  }

  /** How many rooms may follow `segment` before a Forking Hall is due. */
  private untilJunction(segment: Segment, previous: Segment) {
    const last = OPENING.length - 1
    if (segment.id < last) return Number.POSITIVE_INFINITY
    if (segment.id === last || segment.kind === 'junction') {
      const rand = createRandom(hashSeed(this.seed, segment.id, SCHEDULE_SALT))
      return randInt(rand, JUNCTION_GAP[0], JUNCTION_GAP[1]) - 1
    }
    return previous.untilJunction - 1
  }
}

/**
 * A weighted pick that never repeats the previous kind (runs are handled separately). No
 * Crossroads or Stairwell straight after a fork; no Crossroads just before a Forking Hall
 * (its previews would have to be one), and a Stairwell is likelier there, so you often climb
 * into a Forking Hall with stairs hanging from its ceiling.
 *
 * The Central Abyss's ring of towers is wide: it never comes straight after a fork (the rooms
 * built down a Crossroads' other ways reach out sideways), and no Crossroads comes straight
 * after it, for the same reason.
 */
function pickKind(rand: () => number, previous: Segment, roomsAfter: number): RandomSegmentKind {
  const weights: Partial<Record<SegmentKind, number>> = { ...SEGMENT_WEIGHTS }
  delete weights[previous.kind]
  delete weights.junction
  if (previous.kind === 'branch') {
    delete weights.crossroads
    delete weights.stairwell
    delete weights.abyss
  }
  if (previous.kind === 'abyss') delete weights.crossroads
  if (roomsAfter < 1) {
    delete weights.crossroads
    if (weights.stairwell !== undefined) weights.stairwell *= 3
  }
  return pickWeighted(rand, weights as Partial<Record<RandomSegmentKind, number>>)
}
