import { useMemo } from 'react'
import { seedFromPosition } from './geometry'
import { getRoofTileMaterial, getWoodMaterial } from './materials'
import { buildRoof } from './roofGeometry'
import type { KitTransform, Vec3 } from './types'
import { useDisposable } from './useDisposable'

export interface RoofProps extends KitTransform {
  /**
   * [width across the slopes (x), rise to the ridge (y), length along the ridge (z)] in meters.
   * `position` is under the middle of the ridge, at the height of the eave tips.
   */
  size?: Vec3
}

/**
 * A gabled temple roof. The cross-section is steep at the ridge and flattens toward the
 * eaves, with a small upturn at the tips; it is extruded along the ridge, then bent so the
 * four corners sweep upward (sori). Tiles on top, cedar on the underside and the gable
 * ends (one mesh, two material groups), plus a ridge cap with end blocks.
 */
export default function Roof({ position, rotation, size = [5, 1.6, 4], seed }: RoofProps) {
  const [w, h, d] = size
  const s = seed ?? seedFromPosition(position)
  const geo = useDisposable(() => buildRoof(w, h, d, s), [w, h, d, s])
  // Group 0 (up-facing) gets tiles, group 1 (underside, gable ends) gets cedar.
  const materials = useMemo(() => [getRoofTileMaterial(), getWoodMaterial()], [])

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geo.shell} material={materials} />
      <mesh geometry={geo.ridge} material={getRoofTileMaterial()} />
    </group>
  )
}

