import { straightPlan, type SegmentDefinition } from '../../segment'
import { followTatami, generateTatami, type TatamiParams } from './layout'
import TatamiRoom from './TatamiRoom'

export const tatamiDefinition: SegmentDefinition<TatamiParams> = {
  kind: 'tatami',
  area: 'The Tatami Room',
  kanji: '座敷',
  generate: (rand) => generateTatami(rand),
  plan: (p) => straightPlan(p.size),
  Component: TatamiRoom,
  continues: (p) => p.runLeft > 0,
  follow: (p, rand) => followTatami(p, rand),
}
