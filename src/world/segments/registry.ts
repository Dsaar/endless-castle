import type { SegmentDefinition, SegmentKind } from '../segment'
import { corridorDefinition } from './corridor/definition'
import { galleryDefinition } from './gallery/definition'
import { tatamiDefinition } from './tatami/definition'
import { thresholdDefinition } from './threshold/definition'
import { walkwayDefinition } from './walkway/definition'

/** The kinds the generator picks from at random (the Gate only ever comes first). */
export type RandomSegmentKind = Exclude<SegmentKind, 'gate'>

export const SEGMENT_DEFINITIONS: Record<RandomSegmentKind, SegmentDefinition<unknown>> = {
  threshold: thresholdDefinition,
  walkway: walkwayDefinition,
  corridor: corridorDefinition,
  gallery: galleryDefinition,
  tatami: tatamiDefinition,
}

/** How often each kind is picked. The previous kind is never picked twice in a row. */
export const SEGMENT_WEIGHTS: Record<RandomSegmentKind, number> = {
  threshold: 0.8,
  walkway: 1.2,
  corridor: 1.3,
  gallery: 1.1,
  tatami: 1.0,
}

export const RANDOM_SEGMENT_KINDS = Object.keys(SEGMENT_DEFINITIONS) as RandomSegmentKind[]
