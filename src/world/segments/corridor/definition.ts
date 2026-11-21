import { straightPlan, type SegmentDefinition } from '../../segment'
import { generateCorridor, type CorridorParams } from './layout'
import ShojiCorridor from './ShojiCorridor'

export const corridorDefinition: SegmentDefinition<CorridorParams> = {
  kind: 'corridor',
  area: 'The Shoji Corridor',
  kanji: '廊下',
  generate: (rand) => generateCorridor(rand),
  plan: (p) => straightPlan(p.length),
  Component: ShojiCorridor,
}
