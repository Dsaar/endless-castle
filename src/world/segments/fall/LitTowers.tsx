import BoxInstances from '../../../scene/kit/BoxInstances'
import RoofInstances from '../../../scene/kit/RoofInstances'
import ShojiInstances from '../../../scene/kit/ShojiInstances'
import { SHAFT_ROOF, TOWER_BODY, TOWER_EAVE, TOWER_PANEL, type ShaftLayout } from './shaftLayout'

interface LitTowersProps {
  towers: ShaftLayout['towers']
  seed: number
}

/**
 * Towers of lit stories far out around the shaft, some upright, some hanging roof first.
 * Seven draw calls for all of them.
 */
export default function LitTowers({ towers, seed }: LitTowersProps) {
  return (
    <group>
      <BoxInstances size={TOWER_BODY} grain={1} items={towers.bodies} seed={seed} />
      <BoxInstances size={TOWER_EAVE} grain={0} items={towers.eaves} seed={seed + 1} />
      <ShojiInstances size={TOWER_PANEL} kickboard={false} panels={towers.panels} seed={seed + 2} />
      <RoofInstances size={SHAFT_ROOF} items={towers.roofs} seed={seed + 3} />
    </group>
  )
}
