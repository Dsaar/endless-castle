import type { BufferGeometry } from 'three'
import { createRandom } from '../../lib/random'
import { mergeAndDispose, seedFromPosition, texturedBox, uvOffsets } from './geometry'
import { getFloorMaterial, getUnderlayMaterial } from './materials'
import type { KitTransform } from './types'
import { useDisposable } from './useDisposable'

export interface FloorPlanksProps extends KitTransform {
  /** [width (x), depth (z)] in meters. The walking surface is at `position`'s y. */
  size?: [number, number]
  /** Approximate board width in meters; adjusted so whole boards fill the depth. */
  plankWidth?: number
}

const THICKNESS = 0.04
const GAP = 0.007
const MIN_BOARD = 1.4
const MAX_BOARD = 3.6

/**
 * Polished floorboards running along local X, with staggered butt joints and dark gaps.
 * All boards are one merged mesh; a dark underlay below shows through the gaps.
 */
export default function FloorPlanks({ position, rotation, size = [4, 4], plankWidth = 0.2, seed }: FloorPlanksProps) {
  const [width, depth] = size
  const s = seed ?? seedFromPosition(position)

  const boards = useDisposable(() => buildBoards(width, depth, plankWidth, s), [width, depth, plankWidth, s])
  const underlay = useDisposable(
    () => texturedBox([width, 0.01, depth], [0, -THICKNESS + 0.005, 0]),
    [width, depth],
  )

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={boards} material={getFloorMaterial()} />
      <mesh geometry={underlay} material={getUnderlayMaterial()} />
    </group>
  )
}

function buildBoards(width: number, depth: number, plankWidth: number, seed: number): BufferGeometry {
  const rand = createRandom(seed)
  const nextOffset = uvOffsets(seed + 1)
  const rows = Math.max(1, Math.round(depth / plankWidth))
  const pw = depth / rows
  const parts: BufferGeometry[] = []

  for (let r = 0; r < rows; r++) {
    const z = -depth / 2 + pw * (r + 0.5)
    // Start each row part-way through a board so joints never line up between rows.
    let x = -width / 2 - rand() * MAX_BOARD * 0.8
    while (x < width / 2) {
      const len = MIN_BOARD + rand() * (MAX_BOARD - MIN_BOARD)
      const x0 = Math.max(x, -width / 2)
      const x1 = Math.min(x + len, width / 2)
      x += len
      // Gaps only between boards, not at the outer edges.
      const g0 = x0 > -width / 2 ? GAP / 2 : 0
      const g1 = x1 < width / 2 ? GAP / 2 : 0
      const boardLen = x1 - x0 - g0 - g1
      if (boardLen < 0.05) continue
      parts.push(
        texturedBox([boardLen, THICKNESS, pw - GAP], [(x0 + g0 + x1 - g1) / 2, -THICKNESS / 2, z], {
          grain: 0,
          uvOffset: nextOffset(),
        }),
      )
    }
  }
  return mergeAndDispose(parts)
}
