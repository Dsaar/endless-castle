import type { SegmentDefinition } from '../../segment'
import Gate from '../Gate'
import { GATE_EXIT_Z, GATE_PATH_POINTS } from './layout'

/** The Gate as segment 0: always first, never generated at random, no variations. */
export const gateDefinition: SegmentDefinition<null> = {
  kind: 'gate',
  area: 'The Gate',
  kanji: '城門',
  generate: () => null,
  plan: () => ({ points: GATE_PATH_POINTS, end: { x: 0, y: 0, z: GATE_EXIT_Z, yaw: 0 } }),
  Component: Gate,
}
