import type { SegmentDefinition } from '../../segment'
import { generateHall, HALL_EXITS, hallBranch, hallPlan, type HallParams } from '../hall/layout'
import JunctionHall from './JunctionHall'

/** Comes every 3 to 5 rooms (see `WorldGenerator`), never at random. */
export const junctionDefinition: SegmentDefinition<HallParams> = {
  kind: 'junction',
  area: 'The Forking Hall',
  kanji: '岐路',
  generate: (rand, context) => generateHall(rand, context),
  plan: () => hallPlan(),
  Component: JunctionHall,
  fork: {
    picker: 'turn',
    choices: HALL_EXITS,
    branch: (_, choice) => hallBranch(choice),
  },
}
