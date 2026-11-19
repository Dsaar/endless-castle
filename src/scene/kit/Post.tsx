import { seedFromPosition, texturedBox, uvOffsets } from './geometry'
import { getWoodMaterial } from './materials'
import type { KitTransform, Vec3 } from './types'
import { useDisposable } from './useDisposable'

export interface PostProps extends KitTransform {
  /** [width (x), height (y), depth (z)] in meters. `position` is the center of the base. */
  size?: Vec3
}

/** A vertical cedar post standing on `position`, grain running up its length. */
export default function Post({ position, rotation, size = [0.3, 3, 0.3], seed }: PostProps) {
  const [x, y, z] = size
  const s = seed ?? seedFromPosition(position)
  const geometry = useDisposable(
    () => texturedBox([x, y, z], [0, y / 2, 0], { grain: 1, uvOffset: uvOffsets(s)() }),
    [x, y, z, s],
  )
  return <mesh geometry={geometry} material={getWoodMaterial()} position={position} rotation={rotation} />
}
