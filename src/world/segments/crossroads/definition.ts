import type { SegmentDefinition } from '../../segment'
import { generateHall, HALL_EXITS, hallBranch, hallPlan, type HallParams } from '../hall/layout'
import Crossroads from './Crossroads'

export const crossroadsDefinition: SegmentDefinition<HallParams> = {
  kind: 'crossroads',
  area: 'The Crossroads',
  kanji: '辻',
  generate: (rand, context) => generateHall(rand, context),
  plan: () => hallPlan(),
  Component: Crossroads,
  fork: {
    picker: 'turn',
    choices: HALL_EXITS,
    branch: (_, choice) => hallBranch(choice),
    preview: true,
  },
}
