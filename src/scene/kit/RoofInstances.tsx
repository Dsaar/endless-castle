import { useMemo } from 'react'
import KitInstances from './KitInstances'
import { getRoofTileMaterial, getWoodMaterial } from './materials'
import { buildRoof } from './roofGeometry'
import type { InstanceTransform, Vec3 } from './types'
import { useDisposable } from './useDisposable'

interface RoofInstancesProps {
  /** [width across the slopes, rise to the ridge, length along the ridge], shared by every copy. */
  size: Vec3
  /** Each copy's eave-tip center. `pitch: Math.PI` hangs it upside down; `scale` sizes it up. */
  items: readonly InstanceTransform[]
  seed?: number
}

/** Identical temple roofs (see `Roof`) in three draw calls: tiles, cedar underside, ridge caps. */
export default function RoofInstances({ size, items, seed = 1 }: RoofInstancesProps) {
  const [w, h, d] = size
  const geo = useDisposable(() => buildRoof(w, h, d, seed), [w, h, d, seed])
  // Group 0 (up-facing) gets tiles, group 1 (underside, gable ends) gets cedar.
  const materials = useMemo(() => [getRoofTileMaterial(), getWoodMaterial()], [])

  return (
    <>
      <KitInstances geometry={geo.shell} material={materials} items={items} />
      <KitInstances geometry={geo.ridge} material={getRoofTileMaterial()} items={items} />
    </>
  )
}
