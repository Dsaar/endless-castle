import { useMemo } from 'react'
import BoxInstances from '../../../scene/kit/BoxInstances'
import FloorPlanks from '../../../scene/kit/FloorPlanks'
import LanternInstances from '../../../scene/kit/LanternInstances'
import MergedBoxes from '../../../scene/kit/MergedBoxes'
import Railing from '../../../scene/kit/Railing'
import Roof from '../../../scene/kit/Roof'
import type { SegmentProps } from '../../segment'
import { treadSize } from '../stairs'
import {
  BALUSTER,
  buildStairwellLayout,
  DECK_LENGTH,
  DECK_WIDTH,
  FLIGHT_WIDTH,
  FORK_LANTERN_CORD,
  FORK_LANTERN_SIZE,
  NEWEL_LANTERN_SIZE,
  SUPPORT,
  TOWER_POST,
  type StairwellParams,
} from './layout'

/**
 * The Stairwell: you stop on the deck where the way splits. One flight climbs a story to a
 * lantern-lit landing, the other goes down a story into the dark (the guide's ↑ ↓: E or Q).
 * Open treads, so the void shows between them. Lanterns at the deck's corners, over the deck,
 * on the newel post where the flights part, and on both landings. About 22 draw calls.
 */
export default function Stairwell({ segment }: SegmentProps<StairwellParams>) {
  const p = segment.params
  const layout = useMemo(() => buildStairwellLayout(p), [p])

  return (
    <group>
      <FloorPlanks position={[0, 0, -DECK_LENGTH / 2]} rotation={[0, Math.PI / 2, 0]} size={[DECK_LENGTH, DECK_WIDTH]} seed={p.seed} />
      <MergedBoxes boxes={layout.boxes} seed={p.seed} />
      <BoxInstances size={treadSize(FLIGHT_WIDTH)} grain={0} items={layout.treads} seed={p.seed + 1} />
      <BoxInstances size={BALUSTER} anchor="base" grain={1} items={layout.balusters} seed={p.seed + 2} />
      <BoxInstances size={TOWER_POST} anchor="base" grain={1} items={layout.towerPosts} seed={p.seed + 3} />
      <BoxInstances size={SUPPORT} anchor="base" grain={1} items={layout.supports} seed={p.seed + 4} />
      {layout.railings.map((r, i) => (
        <Railing key={i} position={r.position} rotation={[0, Math.PI / 2, 0]} length={r.length} seed={p.seed + 5 + i} />
      ))}
      <Roof position={layout.roof.position} size={layout.roof.size} seed={p.seed} />
      <LanternInstances kind="standing" lanterns={layout.standing} size={1} intensity={5} />
      <LanternInstances
        kind="hanging"
        lanterns={layout.hanging}
        size={FORK_LANTERN_SIZE}
        cord={FORK_LANTERN_CORD}
        intensity={12}
      />
      <LanternInstances kind="standing" lanterns={layout.newel} size={NEWEL_LANTERN_SIZE} intensity={5} />
    </group>
  )
}
