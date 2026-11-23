import BoxInstances from '../../../scene/kit/BoxInstances'
import LanternInstances from '../../../scene/kit/LanternInstances'
import { STAIR_LANDING, STAIR_LANTERN_SIZE, STAIR_STRINGER, STEP, type ShaftLayout } from './shaftLayout'

interface FloatingStairsProps {
  stairs: ShaftLayout['stairs']
  seed: number
}

/**
 * Flights of stairs floating in the shaft with nothing holding them up: level, tilted or
 * upside down, the level ones with a lantern on the landing. Six draw calls for all of them.
 */
export default function FloatingStairs({ stairs, seed }: FloatingStairsProps) {
  return (
    <group>
      <BoxInstances size={STEP} grain={0} items={stairs.steps} seed={seed} />
      <BoxInstances size={STAIR_LANDING} grain={0} items={stairs.landings} seed={seed + 1} />
      <BoxInstances size={STAIR_STRINGER} grain={2} items={stairs.stringers} seed={seed + 2} />
      <LanternInstances kind="standing" lanterns={stairs.lanterns} size={STAIR_LANTERN_SIZE} intensity={4} />
    </group>
  )
}
