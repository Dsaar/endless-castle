import { useMemo } from 'react'
import BoxInstances from '../../../scene/kit/BoxInstances'
import FloorPlanks from '../../../scene/kit/FloorPlanks'
import LanternInstances from '../../../scene/kit/LanternInstances'
import MergedBoxes from '../../../scene/kit/MergedBoxes'
import TatamiFloor from '../../../scene/kit/TatamiFloor'
import type { SegmentProps } from '../../segment'
import { buildThresholdLayout, PIER_DEPTH, PIER_SIZE, SIDE_FLOOR, SIDE_FLOOR_X, STRIP_WIDTH, type ThresholdParams } from './layout'

/**
 * The Threshold: an open walkway hung in the void, no railings, lined on both sides with
 * standing lanterns, and a glowing tatami runner down the middle. Piers drop away beneath it.
 * About 10 draw calls, whatever its length.
 */
export default function Threshold({ segment }: SegmentProps<ThresholdParams>) {
  const p = segment.params
  const layout = useMemo(() => buildThresholdLayout(p), [p])
  const L = p.length

  return (
    <group>
      {[-1, 1].map((side) => (
        <FloorPlanks
          key={side}
          position={[side * SIDE_FLOOR_X, 0, -L / 2]}
          size={[SIDE_FLOOR, L]}
          plankWidth={0.24}
          seed={p.seed + side}
        />
      ))}
      <TatamiFloor position={[0, 0, -L / 2]} size={[STRIP_WIDTH, L]} glow seed={p.seed} />
      <MergedBoxes boxes={layout.boxes} seed={p.seed} />
      <BoxInstances size={[PIER_SIZE, PIER_DEPTH, PIER_SIZE]} anchor="base" grain={1} items={layout.piers} seed={p.seed} />
      <LanternInstances kind="standing" lanterns={layout.lanterns} size={1.1} intensity={5} />
    </group>
  )
}
