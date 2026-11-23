import type { SegmentDefinition } from '../../segment'
import { fallPlan, generateFall, type FallParams } from './layout'
import TheFall from './TheFall'

/** The Fall: always segment 2, after the first Threshold, landing on a Suspended Walkway. */
export const fallDefinition: SegmentDefinition<FallParams> = {
  kind: 'fall',
  area: 'The Fall',
  kanji: '落下',
  generate: (rand) => generateFall(rand),
  plan: () => fallPlan(),
  Component: TheFall,
}
