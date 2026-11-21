import { getUnitPlane, seedFromPosition } from './geometry'
import { getShojiDarkMaterial, getShojiLitMaterial, getWoodMaterial } from './materials'
import { buildShojiFrame, shojiPaperRect } from './shojiGeometry'
import type { KitTransform } from './types'
import { useDisposable } from './useDisposable'

export interface ShojiPanelProps extends KitTransform {
  /** [width (x), height (y)] in meters. `position` is the center of the bottom edge. */
  size?: [number, number]
  /** Backlit paper that glows (and blooms), or plain paper lit only by the scene. */
  lit?: boolean
  /** A solid wooden kickboard below the paper. */
  kickboard?: boolean
}

/**
 * A sliding shoji screen: cedar frame, a lattice (kumiko) of thin bars, and a paper plane
 * in the middle of the frame's depth, so it reads from both sides. Frame and lattice are one
 * merged mesh; the paper is a second mesh using a shared lit or unlit material.
 * For walls of identical panels, `ShojiInstances` draws them all in a few draw calls.
 */
export default function ShojiPanel({
  position,
  rotation,
  size = [0.9, 1.8],
  lit = true,
  kickboard = true,
  seed,
}: ShojiPanelProps) {
  const [w, h] = size
  const s = seed ?? seedFromPosition(position)
  const paper = shojiPaperRect(w, h, kickboard)

  const frame = useDisposable(() => buildShojiFrame(w, h, kickboard, s), [w, h, kickboard, s])

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={frame} material={getWoodMaterial()} />
      <mesh
        geometry={getUnitPlane()}
        material={lit ? getShojiLitMaterial() : getShojiDarkMaterial()}
        position={[0, paper.bottom + paper.height / 2, 0]}
        scale={[paper.width, paper.height, 1]}
      />
    </group>
  )
}
