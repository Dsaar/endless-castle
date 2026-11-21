import type { BufferGeometry } from 'three'
import { mergeAndDispose, seedFromPosition, texturedBox, uvOffsets } from './geometry'
import { getTatamiBorderMaterial, getTatamiGlowMaterial, getTatamiMaterial, getUnderlayMaterial } from './materials'
import { layoutTatami } from './tatamiLayout'
import type { KitTransform } from './types'
import { useDisposable } from './useDisposable'

export interface TatamiFloorProps extends KitTransform {
  /**
   * [width (x), depth (z)] in meters. Rounded to whole half-mat cells of about 0.91 m,
   * then stretched slightly to fill the area exactly. 3.64 × 3.64 is an eight-mat room.
   * The mat surface is at `position`'s y.
   */
  size?: [number, number]
  /** Faintly self-lit mats, as if lit from within (a glowing runner). */
  glow?: boolean
}

const CELL = 0.91
const THICKNESS = 0.055
const GAP = 0.004
const BORDER = 0.034
const BORDER_RISE = 0.002
/** Tatami texture footprint in meters. */
const TATAMI_UV: [number, number] = [0.5, 0.5]

interface TatamiGeometry {
  mats: BufferGeometry
  borders: BufferGeometry
  underlay: BufferGeometry
  dispose: () => void
}

/**
 * Tatami mats in the traditional layout (no four corners meeting), each with dark cloth
 * borders along its long sides. Mats and borders are two merged meshes.
 */
export default function TatamiFloor({ position, rotation, size = [3.64, 3.64], glow = false, seed }: TatamiFloorProps) {
  const [width, depth] = size
  const s = seed ?? seedFromPosition(position)
  const geo = useDisposable(() => buildTatami(width, depth, s), [width, depth, s])

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geo.mats} material={glow ? getTatamiGlowMaterial() : getTatamiMaterial()} />
      <mesh geometry={geo.borders} material={getTatamiBorderMaterial()} />
      <mesh geometry={geo.underlay} material={getUnderlayMaterial()} />
    </group>
  )
}

function buildTatami(width: number, depth: number, seed: number): TatamiGeometry {
  const cols = Math.max(1, Math.round(width / CELL))
  const rows = Math.max(1, Math.round(depth / CELL))
  const cw = width / cols
  const cd = depth / rows
  const off = uvOffsets(seed)
  const matParts: BufferGeometry[] = []
  const borderParts: BufferGeometry[] = []

  for (const m of layoutTatami(cols, rows, seed)) {
    const sx = m.w * cw - GAP
    const sz = m.h * cd - GAP
    const cx = -width / 2 + (m.col + m.w / 2) * cw
    const cz = -depth / 2 + (m.row + m.h / 2) * cd
    const alongX = sx >= sz
    // Texture U runs along the mat's long side, so the rush stalks lie across it.
    matParts.push(
      texturedBox([sx, THICKNESS, sz], [cx, -THICKNESS / 2, cz], {
        grain: alongX ? 0 : 2,
        uvScale: TATAMI_UV,
        uvOffset: off(),
      }),
    )
    // Borders (heri) on the two long sides, wrapping slightly over the edge.
    const bh = THICKNESS + BORDER_RISE
    for (const side of [-1, 1]) {
      if (alongX) {
        borderParts.push(texturedBox([sx, bh, BORDER], [cx, -THICKNESS / 2 + BORDER_RISE / 2, cz + side * (sz / 2 - BORDER / 2 + 0.001)]))
      } else {
        borderParts.push(texturedBox([BORDER, bh, sz], [cx + side * (sx / 2 - BORDER / 2 + 0.001), -THICKNESS / 2 + BORDER_RISE / 2, cz]))
      }
    }
  }

  const mats = mergeAndDispose(matParts)
  const borders = mergeAndDispose(borderParts)
  const underlay = texturedBox([width, 0.01, depth], [0, -THICKNESS + 0.005, 0])
  return {
    mats,
    borders,
    underlay,
    dispose: () => {
      mats.dispose()
      borders.dispose()
      underlay.dispose()
    },
  }
}
