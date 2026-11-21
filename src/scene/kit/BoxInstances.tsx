import type { Material } from 'three'
import { texturedBox, uvOffsets } from './geometry'
import KitInstances from './KitInstances'
import { getWoodMaterial } from './materials'
import type { InstanceTransform, Vec3 } from './types'
import { useDisposable } from './useDisposable'

interface BoxInstancesProps {
  /** [x, y, z] of every copy, in meters. */
  size: Vec3
  items: readonly InstanceTransform[]
  /** `base`: each item's position is the center of the bottom face (posts). `center` otherwise. */
  anchor?: 'center' | 'base'
  /** Grain axis. Defaults to the longest. */
  grain?: 0 | 1 | 2
  /** Cedar by default. */
  material?: Material
  seed?: number
}

/**
 * Identical cedar boxes (posts, planks, battens, rails) as one instanced draw call, with the
 * kit's world-scaled grain. Stretch with `scale` only a little, or the grain stretches too.
 */
export default function BoxInstances({ size, items, anchor = 'center', grain, material, seed = 1 }: BoxInstancesProps) {
  const [x, y, z] = size
  const geometry = useDisposable(
    () => texturedBox([x, y, z], [0, anchor === 'base' ? y / 2 : 0, 0], { grain, uvOffset: uvOffsets(seed)() }),
    [x, y, z, anchor, grain, seed],
  )
  return <KitInstances geometry={geometry} material={material ?? getWoodMaterial()} items={items} />
}
