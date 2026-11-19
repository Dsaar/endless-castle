import type { BufferGeometry } from 'three'
import { mergeAndDispose, seedFromPosition, texturedBox, uvOffsets } from './geometry'
import { getWoodMaterial } from './materials'
import type { KitTransform } from './types'
import { useDisposable } from './useDisposable'

export interface RailingProps extends KitTransform {
  /** Length along local X, in meters. Centered on `position`. */
  length?: number
  /** [height (y), post width] in meters. `position` is at floor level. */
  size?: [number, number]
}

const POST_SPACING = 1.5

/**
 * A balcony railing (kōran): evenly spaced posts, a wide top rail and a lower rail,
 * merged into one mesh. End posts rise a little above the top rail with a cap.
 */
export default function Railing({ position, rotation, length = 3, size = [0.9, 0.1], seed }: RailingProps) {
  const [height, postWidth] = size
  const s = seed ?? seedFromPosition(position)
  const geometry = useDisposable(() => buildRailing(length, height, postWidth, s), [length, height, postWidth, s])
  return <mesh geometry={geometry} material={getWoodMaterial()} position={position} rotation={rotation} />
}

function buildRailing(length: number, height: number, post: number, seed: number): BufferGeometry {
  const off = uvOffsets(seed)
  const parts: BufferGeometry[] = []
  const bays = Math.max(1, Math.ceil(length / POST_SPACING))
  const span = length - post
  const topRail = post * 0.75
  const capRise = post * 0.9

  for (let i = 0; i <= bays; i++) {
    const x = -span / 2 + (span * i) / bays
    const isEnd = i === 0 || i === bays
    const h = isEnd ? height + capRise : height
    parts.push(texturedBox([post, h, post], [x, h / 2, 0], { grain: 1, uvOffset: off() }))
    if (isEnd) {
      // A stepped cap on the end posts.
      parts.push(texturedBox([post * 1.35, post * 0.35, post * 1.35], [x, h + post * 0.17, 0], { uvOffset: off() }))
    }
  }

  // Top rail: wider than the posts and resting on them.
  parts.push(texturedBox([span, topRail, post * 1.5], [0, height - topRail / 2, 0], { grain: 0, uvOffset: off() }))
  // Lower rail, low between the posts.
  parts.push(texturedBox([span, post * 0.6, post * 0.6], [0, height * 0.24, 0], { grain: 0, uvOffset: off() }))

  return mergeAndDispose(parts)
}
