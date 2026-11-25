import { straightPlan, type SegmentDefinition } from '../../segment'
import InvertedChamber from './InvertedChamber'
import { generateInverted, type InvertedParams } from './layout'

export const invertedDefinition: SegmentDefinition<InvertedParams> = {
  kind: 'inverted',
  area: 'The Inverted Chamber',
  kanji: '逆さの間',
  generate: (rand) => generateInverted(rand),
  plan: (p) => straightPlan(p.length),
  Component: InvertedChamber,
}
