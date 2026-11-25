import { useMemo } from 'react'
import BoxInstances from '../../../scene/kit/BoxInstances'
import FloorPlanks from '../../../scene/kit/FloorPlanks'
import HangingScroll from '../../../scene/kit/HangingScroll'
import LanternInstances from '../../../scene/kit/LanternInstances'
import { getPlasterMaterial } from '../../../scene/kit/materials'
import MergedBoxes from '../../../scene/kit/MergedBoxes'
import Roof from '../../../scene/kit/Roof'
import ShojiInstances from '../../../scene/kit/ShojiInstances'
import TatamiFloor from '../../../scene/kit/TatamiFloor'
import type { SegmentProps } from '../../segment'
import { WALL_PANEL_SIZE } from '../shojiWall'
import {
  BATTEN,
  buildInvertedLayout,
  CHAMBER_HEIGHT,
  CHAMBER_WIDTH,
  CUSHION,
  END_PANEL_SIZE,
  LANTERN_CORD,
  PIER,
  POST,
  SCREEN_PANEL,
  type InvertedParams,
} from './layout'

/**
 * The Inverted Chamber: tatami, low tables, cushions, floor lanterns, a folding screen and a
 * scroll, all on the ceiling, upside down. The floor is bare boards with battens, lanterns hang
 * up from it, and the roof hangs underneath. A few steps in, the camera rolls over and you walk
 * on the ceiling (`InvertDirector`); near the far door it rolls back. About 25 draw calls.
 */
export default function InvertedChamber({ segment }: SegmentProps<InvertedParams>) {
  const p = segment.params
  const layout = useMemo(() => buildInvertedLayout(p), [p])
  const L = p.length
  const H = CHAMBER_HEIGHT

  return (
    <group>
      <FloorPlanks position={[0, 0, -L / 2]} rotation={[0, Math.PI / 2, 0]} size={[L, CHAMBER_WIDTH]} seed={p.seed} />
      {/* The ceiling is the room's real floor: tatami, face down. */}
      <TatamiFloor position={[0, H, -L / 2]} rotation={[Math.PI, 0, 0]} size={[CHAMBER_WIDTH, L]} seed={p.seed} />
      <MergedBoxes boxes={layout.boxes} seed={p.seed} />
      <BoxInstances size={CUSHION} grain={0} material={getPlasterMaterial()} items={layout.cushions} seed={p.seed + 1} />
      <BoxInstances size={POST} anchor="base" grain={1} items={layout.posts} seed={p.seed + 2} />
      <BoxInstances size={BATTEN} grain={0} items={layout.battens} seed={p.seed + 3} />
      <BoxInstances size={PIER} anchor="base" grain={1} items={layout.piers} seed={p.seed + 4} />
      {/* No kickboards: the panels read the same either way up. */}
      <ShojiInstances size={WALL_PANEL_SIZE} kickboard={false} panels={layout.panels} seed={p.seed} />
      <ShojiInstances size={END_PANEL_SIZE} kickboard={false} panels={layout.endPanels} seed={p.seed + 1} />
      <ShojiInstances size={SCREEN_PANEL} kickboard={false} panels={layout.screens} seed={p.seed + 2} />
      <LanternInstances kind="hanging" lanterns={layout.rising} size={1} cord={LANTERN_CORD} intensity={7} />
      <LanternInstances kind="standing" lanterns={layout.andon} size={1} intensity={5} />
      <HangingScroll position={layout.scroll.position} rotation={[0, layout.scroll.yaw, Math.PI]} />
      {/* The roof hangs under the floor. */}
      <Roof position={[0, -0.36, -L / 2]} rotation={[Math.PI, 0, 0]} size={[CHAMBER_WIDTH + 1.8, 1.25, L]} seed={p.seed} />
    </group>
  )
}
