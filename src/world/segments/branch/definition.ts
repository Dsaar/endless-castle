import type { BranchChoice, BranchPlan, SegmentDefinition, SegmentKind } from '../../segment'
import BranchWalk from './BranchWalk'

/** The walk out of a fork along the chosen way. */
export interface BranchParams {
  forkId: number
  /** The fork's kind. */
  from: SegmentKind
  choice: BranchChoice
  plan: BranchPlan
}

/**
 * Not a room of its own: `WorldGenerator` places one after a fork once a way is chosen, with
 * the fork's area, kanji and room number. Its walk is the fork's `branch` plan.
 */
export const branchDefinition: SegmentDefinition<BranchParams> = {
  kind: 'branch',
  area: '',
  kanji: '',
  generate: () => {
    throw new Error('A branch is only placed by WorldGenerator.resolveFork')
  },
  plan: (p) => p.plan,
  Component: BranchWalk,
}
