import BoxInstances from '../../../scene/kit/BoxInstances'
import LanternInstances from '../../../scene/kit/LanternInstances'
import {
  PILLAR_ARM,
  PILLAR_CAP,
  PILLAR_FOOT,
  PILLAR_LANTERN_CORD,
  PILLAR_LANTERN_SIZE,
  PILLAR_SHAFT,
  type ShaftLayout,
} from './shaftLayout'

interface HangingPillarsProps {
  pillars: ShaftLayout['pillars']
  seed: number
}

/**
 * Pillars hanging out of the dark above the shaft, each ending in a cross-shaped base with a
 * lantern beneath it. Seven draw calls for all of them.
 */
export default function HangingPillars({ pillars, seed }: HangingPillarsProps) {
  return (
    <group>
      <BoxInstances size={PILLAR_SHAFT} anchor="base" grain={1} items={pillars.shafts} seed={seed} />
      <BoxInstances size={PILLAR_ARM} grain={0} items={pillars.arms} seed={seed + 1} />
      <BoxInstances size={PILLAR_CAP} grain={1} items={pillars.caps} seed={seed + 2} />
      <BoxInstances size={PILLAR_FOOT} grain={1} items={pillars.feet} seed={seed + 3} />
      <LanternInstances
        kind="hanging"
        lanterns={pillars.lanterns}
        size={PILLAR_LANTERN_SIZE}
        cord={PILLAR_LANTERN_CORD}
        intensity={6}
      />
    </group>
  )
}
