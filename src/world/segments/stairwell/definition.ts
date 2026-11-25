import type { SegmentDefinition } from '../../segment'
import { generateStairwell, stairwellBranch, stairwellPlan, type StairwellParams } from './layout'
import Stairwell from './Stairwell'

export const stairwellDefinition: SegmentDefinition<StairwellParams> = {
  kind: 'stairwell',
  area: 'The Stairwell',
  kanji: '階段',
  generate: (rand) => generateStairwell(rand),
  plan: () => stairwellPlan(),
  Component: Stairwell,
  fork: {
    picker: 'stairs',
    choices: ['up', 'down'],
    branch: (p, choice) => stairwellBranch(p, choice),
  },
}
