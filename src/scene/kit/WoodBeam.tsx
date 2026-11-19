import { seedFromPosition, texturedBox, uvOffsets } from './geometry'
import { getWoodMaterial } from './materials'
import type { KitTransform, Vec3 } from './types'
import { useDisposable } from './useDisposable'

export interface WoodBeamProps extends KitTransform {
  /** [length (x), height (y), depth (z)] in meters. Centered on `position`. */
  size?: Vec3
}

/** A horizontal cedar beam running along local X. */
export default function WoodBeam({ position, rotation, size = [4, 0.24, 0.24], seed }: WoodBeamProps) {
  const [x, y, z] = size
  const s = seed ?? seedFromPosition(position)
  const geometry = useDisposable(() => texturedBox([x, y, z], [0, 0, 0], { grain: 0, uvOffset: uvOffsets(s)() }), [x, y, z, s])
  return <mesh geometry={geometry} material={getWoodMaterial()} position={position} rotation={rotation} />
}
