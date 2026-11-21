import { useMemo } from 'react'
import BoxInstances from '../../../scene/kit/BoxInstances'
import LanternInstances from '../../../scene/kit/LanternInstances'
import FloatingPavilion from '../../pieces/FloatingPavilion'
import type { SegmentProps } from '../../segment'
import {
  ARM,
  buildWalkwayLayout,
  CORD,
  LANTERN_CORD,
  LANTERN_POST,
  LANTERN_SIZE,
  PLANK,
  RAIL,
  RAIL_POST,
  STRINGER,
  type WalkwayParams,
} from './layout'

/**
 * The Suspended Walkway: a narrow plank bridge that curves and arches across the void, hung
 * from cords that rise out of sight. Low rope rails, lanterns on posts with arms reaching
 * over the walk, and a few pavilions floating around it. Every repeated piece is instanced:
 * about 12 draw calls for the bridge, plus six per pavilion.
 */
export default function SuspendedWalkway({ segment }: SegmentProps<WalkwayParams>) {
  const p = segment.params
  const layout = useMemo(() => buildWalkwayLayout(p), [p])

  return (
    <group>
      <BoxInstances size={PLANK} grain={0} items={layout.planks} seed={p.seed} />
      <BoxInstances size={STRINGER} grain={2} items={layout.stringers} seed={p.seed + 1} />
      <BoxInstances size={RAIL_POST} grain={1} items={layout.railPosts} seed={p.seed + 2} />
      <BoxInstances size={RAIL} grain={2} items={layout.rails} seed={p.seed + 3} />
      <BoxInstances size={LANTERN_POST} anchor="base" grain={1} items={layout.lanternPosts} seed={p.seed + 4} />
      <BoxInstances size={ARM} grain={0} items={layout.arms} seed={p.seed + 5} />
      <BoxInstances size={CORD} anchor="base" grain={1} items={layout.cords} seed={p.seed + 6} />
      <LanternInstances kind="hanging" lanterns={layout.lanterns} size={LANTERN_SIZE} cord={LANTERN_CORD} intensity={7} />
      {p.pavilions.map((spec) => (
        <FloatingPavilion key={spec.seed} spec={spec} />
      ))}
    </group>
  )
}
