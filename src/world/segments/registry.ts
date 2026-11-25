import type { SegmentDefinition, SegmentKind } from '../segment'
import { corridorDefinition } from './corridor/definition'
import { crossroadsDefinition } from './crossroads/definition'
import { galleryDefinition } from './gallery/definition'
import { junctionDefinition } from './junction/definition'
import { stairwellDefinition } from './stairwell/definition'
import { tatamiDefinition } from './tatami/definition'
import { thresholdDefinition } from './threshold/definition'
import { walkwayDefinition } from './walkway/definition'

/**
 * The kinds the generator places as rooms (and the dev panel can force). The Gate and the Fall
 * are scripted: they only ever come in the castle's fixed opening. A `branch` is the walk out
 * of a fork, placed when a way is chosen (see `WorldGenerator`).
 */
export type RandomSegmentKind = Exclude<SegmentKind, 'gate' | 'fall' | 'branch'>

export const SEGMENT_DEFINITIONS: Record<RandomSegmentKind, SegmentDefinition<unknown>> = {
  threshold: thresholdDefinition,
  walkway: walkwayDefinition,
  corridor: corridorDefinition,
  gallery: galleryDefinition,
  tatami: tatamiDefinition,
  junction: junctionDefinition,
  crossroads: crossroadsDefinition,
  stairwell: stairwellDefinition,
}

/**
 * How often each kind is picked. The previous kind is never picked twice in a row. The Forking
 * Hall is never picked: it comes on a schedule, every 3 to 5 rooms. The other two forks never
 * come straight after a fork, and the Crossroads never just before a Forking Hall.
 */
export const SEGMENT_WEIGHTS: Record<RandomSegmentKind, number> = {
  threshold: 0.8,
  walkway: 1.2,
  corridor: 1.3,
  gallery: 1.1,
  tatami: 1.0,
  junction: 0,
  crossroads: 0.45,
  stairwell: 0.6,
}

/** Kinds where the walk divides (each definition has a `fork`). */
export const FORK_KINDS: ReadonlySet<SegmentKind> = new Set<SegmentKind>(['junction', 'crossroads', 'stairwell'])

export const RANDOM_SEGMENT_KINDS = Object.keys(SEGMENT_DEFINITIONS) as RandomSegmentKind[]
