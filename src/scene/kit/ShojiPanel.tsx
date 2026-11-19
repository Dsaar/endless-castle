import type { BufferGeometry } from 'three'
import { getUnitPlane, mergeAndDispose, seedFromPosition, texturedBox, uvOffsets } from './geometry'
import { getShojiDarkMaterial, getShojiLitMaterial, getWoodMaterial } from './materials'
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

const STILE = 0.045
const DEPTH = 0.032
const BAR = 0.013
const BAR_DEPTH = 0.022
const KICK_HEIGHT = 0.24
const CELL_W = 0.22
const CELL_H = 0.27

/**
 * A sliding shoji screen: cedar frame, a lattice (kumiko) of thin bars, and a paper plane
 * in the middle of the frame's depth, so it reads from both sides. Frame and lattice are one
 * merged mesh; the paper is a second mesh using a shared lit or unlit material.
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
  const paperBottom = kickboard ? KICK_HEIGHT : STILE
  const paperW = w - STILE * 2
  const paperH = h - STILE - paperBottom

  const frame = useDisposable(() => buildFrame(w, h, kickboard, s), [w, h, kickboard, s])

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={frame} material={getWoodMaterial()} />
      <mesh
        geometry={getUnitPlane()}
        material={lit ? getShojiLitMaterial() : getShojiDarkMaterial()}
        position={[0, paperBottom + paperH / 2, 0]}
        scale={[paperW, paperH, 1]}
      />
    </group>
  )
}

function buildFrame(w: number, h: number, kickboard: boolean, seed: number): BufferGeometry {
  const off = uvOffsets(seed)
  const parts: BufferGeometry[] = []
  const box = (sx: number, sy: number, sz: number, cx: number, cy: number) =>
    parts.push(texturedBox([sx, sy, sz], [cx, cy, 0], { uvOffset: off() }))

  // Stiles (full height) and rails.
  box(STILE, h, DEPTH, -w / 2 + STILE / 2, h / 2)
  box(STILE, h, DEPTH, w / 2 - STILE / 2, h / 2)
  box(w - STILE * 2, STILE, DEPTH, 0, h - STILE / 2)
  box(w - STILE * 2, STILE, DEPTH, 0, STILE / 2)

  let paperBottom = STILE
  if (kickboard) {
    // Middle rail above a thin solid board.
    box(w - STILE * 2, STILE * 0.8, DEPTH, 0, KICK_HEIGHT - STILE * 0.4)
    box(w - STILE * 2, KICK_HEIGHT - STILE * 1.8, DEPTH * 0.4, 0, STILE + (KICK_HEIGHT - STILE * 1.8) / 2)
    paperBottom = KICK_HEIGHT
  }

  // Lattice: whole cells across the paper area.
  const innerW = w - STILE * 2
  const innerH = h - STILE - paperBottom
  const cols = Math.max(2, Math.round(innerW / CELL_W))
  const rows = Math.max(2, Math.round(innerH / CELL_H))
  for (let c = 1; c < cols; c++) {
    box(BAR, innerH, BAR_DEPTH, -innerW / 2 + (innerW * c) / cols, paperBottom + innerH / 2)
  }
  for (let r = 1; r < rows; r++) {
    box(innerW, BAR, BAR_DEPTH, 0, paperBottom + (innerH * r) / rows)
  }

  return mergeAndDispose(parts)
}
