import { straightPlan, type SegmentDefinition } from '../../segment'
import { followCorridor, generateCorridor, type CorridorParams } from './layout'
import ShojiCorridor from './ShojiCorridor'

export const corridorDefinition: SegmentDefinition<CorridorParams> = {
  kind: 'corridor',
  area: 'The Shoji Corridor',
  kanji: '廊下',
  generate: (rand, context) => generateCorridor(rand, context),
  plan: (p) => straightPlan(p.length),
  Component: ShojiCorridor,
  // A false exit opens onto the same corridor again.
  continues: (p) => p.repeats > 0,
  follow: (p) => followCorridor(p),
}
