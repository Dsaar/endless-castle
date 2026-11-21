import type { SegmentDefinition } from '../../segment'
import { generateWalkway, walkwayPlan, type WalkwayParams } from './layout'
import SuspendedWalkway from './SuspendedWalkway'

export const walkwayDefinition: SegmentDefinition<WalkwayParams> = {
  kind: 'walkway',
  area: 'The Suspended Walkway',
  kanji: '懸橋',
  generate: (rand, context) => generateWalkway(rand, context),
  plan: (p) => walkwayPlan(p),
  Component: SuspendedWalkway,
}
