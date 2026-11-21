import { useMemo } from 'react'
import { getUnitPlane } from './geometry'
import { getScrollClothMaterial, getShojiDarkMaterial } from './materials'
import MergedBoxes from './MergedBoxes'
import type { BoxSpec, KitTransform } from './types'

export interface HangingScrollProps extends Omit<KitTransform, 'seed'> {
  /** [width, height] of the mounting in meters. `position` is the hook, at the top center. */
  size?: [number, number]
}

/**
 * A hanging scroll (kakejiku): vermilion silk mounting around a pale paper panel, a thin
 * rod at the top and a heavier roller at the bottom, on a short cord from the hook.
 * Faces +Z; hang it a couple of centimeters off the wall.
 */
export default function HangingScroll({ position, rotation, size = [0.55, 1.45] }: HangingScrollProps) {
  const [w, h] = size
  const wood = useMemo<BoxSpec[]>(
    () => [
      { size: [0.006, 0.12, 0.006], position: [0, 0.06, 0] }, // cord
      { size: [w + 0.03, 0.022, 0.022], position: [0, -0.011, 0] }, // top rod
      { size: [w + 0.09, 0.034, 0.034], position: [0, -h - 0.012, 0] }, // bottom roller
    ],
    [w, h],
  )

  return (
    <group position={position} rotation={rotation}>
      <MergedBoxes boxes={wood} seed={5} />
      <mesh geometry={getUnitPlane()} material={getScrollClothMaterial()} position={[0, -h / 2, 0]} scale={[w, h, 1]} />
      <mesh
        geometry={getUnitPlane()}
        material={getShojiDarkMaterial()}
        position={[0, -h * 0.46, 0.003]}
        scale={[w * 0.64, h * 0.6, 1]}
      />
    </group>
  )
}
