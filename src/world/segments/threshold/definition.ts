import { straightPlan, type SegmentDefinition } from '../../segment'
import { generateThreshold, type ThresholdParams } from './layout'
import Threshold from './Threshold'

export const thresholdDefinition: SegmentDefinition<ThresholdParams> = {
  kind: 'threshold',
  area: 'The Threshold',
  kanji: '敷居',
  generate: (rand) => generateThreshold(rand),
  plan: (p) => straightPlan(p.length),
  Component: Threshold,
}
