import type { SegmentDefinition } from '../../segment'
import CentralAbyss from './CentralAbyss'
import { abyssPlan, generateAbyss, type AbyssParams } from './layout'

export const abyssDefinition: SegmentDefinition<AbyssParams> = {
  kind: 'abyss',
  area: 'The Central Abyss',
  kanji: '奈落',
  generate: (rand) => generateAbyss(rand),
  plan: (p) => abyssPlan(p),
  Component: CentralAbyss,
}
