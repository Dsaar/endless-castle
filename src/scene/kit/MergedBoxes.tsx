import { BufferGeometry, Euler, Matrix4, type Material } from 'three'
import { mergeAndDispose, texturedBox, uvOffsets } from './geometry'
import { getWoodMaterial } from './materials'
import type { BoxSpec } from './types'
import { useDisposable } from './useDisposable'

interface MergedBoxesProps {
  /** Every box, all different. Memoize the array: a new one rebuilds the geometry. */
  boxes: readonly BoxSpec[]
  /** Cedar by default. */
  material?: Material
  seed?: number
}

/**
 * One-off boxes of all sizes (beams, sills, slabs, fascias) merged into a single mesh with
 * the kit's world-scaled grain: one draw call however many there are. For many copies of
 * the same box, `BoxInstances` is cheaper to build.
 */
export default function MergedBoxes({ boxes, material, seed = 1 }: MergedBoxesProps) {
  const geometry = useDisposable(() => buildBoxes(boxes, seed), [boxes, seed])
  if (boxes.length === 0) return null
  return <mesh geometry={geometry} material={material ?? getWoodMaterial()} />
}

const rotation = new Matrix4()
const euler = new Euler(0, 0, 0, 'YXZ')

function buildBoxes(boxes: readonly BoxSpec[], seed: number): BufferGeometry {
  if (boxes.length === 0) return new BufferGeometry()
  const off = uvOffsets(seed)
  const parts = boxes.map((b) => {
    const g = texturedBox(b.size, [0, 0, 0], { grain: b.grain, uvOffset: off() })
    if (b.yaw || b.pitch) g.applyMatrix4(rotation.makeRotationFromEuler(euler.set(b.pitch ?? 0, b.yaw ?? 0, 0, 'YXZ')))
    g.translate(b.position[0], b.position[1], b.position[2])
    return g
  })
  return mergeAndDispose(parts)
}
