import { useMemo } from 'react'
import { getUnitPlane } from './geometry'
import KitInstances from './KitInstances'
import { getShojiDarkMaterial, getShojiLitMaterial, getWoodMaterial } from './materials'
import { buildShojiFrame, shojiPaperRect } from './shojiGeometry'
import type { InstanceTransform, Vec3 } from './types'
import { useDisposable } from './useDisposable'

export interface ShojiPlacement {
  /** Center of the panel's bottom edge. */
  position: Vec3
  /** 0: the panel spans X and faces ±Z. π/2: it spans Z (a wall along the walk). */
  yaw?: number
  lit: boolean
}

interface ShojiInstancesProps {
  /** [width, height] shared by every panel. */
  size: [number, number]
  kickboard?: boolean
  panels: readonly ShojiPlacement[]
  seed?: number
}

/**
 * A wall's worth of identical shoji panels in three draw calls: every frame and lattice,
 * every lit paper, every unlit paper. Panels stand upright (no pitch).
 */
export default function ShojiInstances({ size, kickboard = true, panels, seed = 7 }: ShojiInstancesProps) {
  const [w, h] = size
  const frame = useDisposable(() => buildShojiFrame(w, h, kickboard, seed), [w, h, kickboard, seed])

  const { frames, lit, dark } = useMemo(() => {
    const paper = shojiPaperRect(w, h, kickboard)
    const paperY = paper.bottom + paper.height / 2
    const frames: InstanceTransform[] = []
    const lit: InstanceTransform[] = []
    const dark: InstanceTransform[] = []
    for (const p of panels) {
      frames.push({ position: p.position, yaw: p.yaw })
      const [x, y, z] = p.position
      ;(p.lit ? lit : dark).push({ position: [x, y + paperY, z], yaw: p.yaw, scale: [paper.width, paper.height, 1] })
    }
    return { frames, lit, dark }
  }, [panels, w, h, kickboard])

  return (
    <>
      <KitInstances geometry={frame} material={getWoodMaterial()} items={frames} />
      <KitInstances geometry={getUnitPlane()} material={getShojiLitMaterial()} items={lit} />
      <KitInstances geometry={getUnitPlane()} material={getShojiDarkMaterial()} items={dark} />
    </>
  )
}
