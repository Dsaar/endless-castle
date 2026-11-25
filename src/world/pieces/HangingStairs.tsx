import { useMemo } from 'react'
import BoxInstances from '../../scene/kit/BoxInstances'
import LanternInstances from '../../scene/kit/LanternInstances'
import MergedBoxes from '../../scene/kit/MergedBoxes'
import { riserSize, treadSize } from '../segments/stairs'
import { buildHangingStairs, type HangingStairsSpec } from './hangingStairsLayout'

interface HangingStairsProps {
  spec: HangingStairsSpec
  /** Height of the ceiling it hangs from. */
  ceiling: number
  seed: number
}

/**
 * A staircase hanging upside down from the ceiling, with an upside-down lantern on its landing.
 * Visual only: nothing walks on it. Six draw calls.
 */
export default function HangingStairs({ spec, ceiling, seed }: HangingStairsProps) {
  const layout = useMemo(() => buildHangingStairs(spec), [spec])
  return (
    <group position={[spec.x, ceiling, spec.z]} rotation={[0, spec.yaw, 0]}>
      <BoxInstances size={treadSize(layout.width)} grain={0} items={layout.treads} seed={seed} />
      <BoxInstances size={riserSize(layout.width)} grain={0} items={layout.risers} seed={seed + 2} />
      <MergedBoxes boxes={layout.boxes} seed={seed + 1} />
      <LanternInstances kind="standing" lanterns={layout.lantern} size={0.85} intensity={4} />
    </group>
  )
}
