import BoxInstances from '../../../scene/kit/BoxInstances'
import FloorPlanks from '../../../scene/kit/FloorPlanks'
import LanternInstances from '../../../scene/kit/LanternInstances'
import { getPlasterMaterial } from '../../../scene/kit/materials'
import MergedBoxes from '../../../scene/kit/MergedBoxes'
import Roof from '../../../scene/kit/Roof'
import RoofInstances from '../../../scene/kit/RoofInstances'
import ShojiInstances from '../../../scene/kit/ShojiInstances'
import HangingStairs from '../../pieces/HangingStairs'
import { WALL_PANEL_SIZE, WALL_TRANSOM_SIZE } from '../shojiWall'
import {
  CENTER_LANTERN_CORD,
  CENTER_LANTERN_SIZE,
  COFFER,
  HALL_HEIGHT,
  HALL_POST,
  PIER,
  VESTIBULE_BATTEN,
  VESTIBULE_LANTERN_CORD,
  VESTIBULE_LANTERN_SIZE,
  VESTIBULE_POST,
  VESTIBULE_ROOF,
  type HallLayout,
  type HallParams,
} from './layout'

interface HallProps {
  params: HallParams
  layout: HallLayout
}

/**
 * The hall where the walk divides, without its doors: shoji walls, plaster and a glowing
 * clerestory band, a coffered ceiling, corner lanterns and a big lantern in the middle,
 * three lit vestibules, and sometimes a staircase hanging from the ceiling. About 45 draw calls.
 */
export default function Hall({ params: p, layout }: HallProps) {
  return (
    <group>
      {layout.floors.map((f, i) => (
        <FloorPlanks key={i} position={f.position} rotation={[0, f.yaw, 0]} size={f.size} seed={p.seed + i} />
      ))}
      <MergedBoxes boxes={layout.boxes} seed={p.seed} />
      <MergedBoxes boxes={layout.plaster} material={getPlasterMaterial()} seed={p.seed + 1} />
      <BoxInstances size={HALL_POST} anchor="base" grain={1} items={layout.posts} seed={p.seed} />
      <BoxInstances size={VESTIBULE_POST} anchor="base" grain={1} items={layout.vestibulePosts} seed={p.seed + 1} />
      <ShojiInstances size={WALL_PANEL_SIZE} panels={layout.panels} seed={p.seed} />
      <ShojiInstances size={WALL_TRANSOM_SIZE} kickboard={false} panels={layout.transoms} seed={p.seed + 1} />
      <BoxInstances size={COFFER} grain={0} items={layout.coffers} seed={p.seed + 2} />
      <BoxInstances size={VESTIBULE_BATTEN} grain={0} items={layout.battens} seed={p.seed + 3} />
      <BoxInstances size={PIER} anchor="base" grain={1} items={layout.piers} seed={p.seed + 4} />
      <Roof position={layout.roof.position} size={layout.roof.size} seed={p.seed} />
      <RoofInstances size={VESTIBULE_ROOF} items={layout.vestibuleRoofs} seed={p.seed + 1} />

      <LanternInstances kind="standing" lanterns={layout.standing} size={1} intensity={5} />
      <LanternInstances
        kind="hanging"
        lanterns={layout.center}
        size={CENTER_LANTERN_SIZE}
        cord={CENTER_LANTERN_CORD}
        intensity={12}
      />
      <LanternInstances
        kind="hanging"
        lanterns={layout.vestibuleLanterns}
        size={VESTIBULE_LANTERN_SIZE}
        cord={VESTIBULE_LANTERN_CORD}
        intensity={6}
      />
      {p.hanging && <HangingStairs spec={p.hanging} ceiling={HALL_HEIGHT} seed={p.seed + 5} />}
    </group>
  )
}
