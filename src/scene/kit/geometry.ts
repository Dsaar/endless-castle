import { BoxGeometry, BufferAttribute, BufferGeometry, PlaneGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { createRandom } from '../../lib/random'
import type { Vec3 } from './types'

/** Wood texture footprint in meters: along the grain, then across it. */
export const WOOD_UV: [number, number] = [2, 0.5]

export interface BoxOptions {
  /** Axis (0 = x, 1 = y, 2 = z) the texture's U follows. Defaults to the box's longest axis. */
  grain?: 0 | 1 | 2
  /** World meters covered by one texture repeat, along U then V. */
  uvScale?: [number, number]
  /** Added to the UVs, so copies don't show the same stretch of grain. */
  uvOffset?: [number, number]
}

/**
 * A box with world-scaled UVs: the texture keeps the same density whatever the box's size,
 * and U follows the grain axis on every face where that axis lies in the face's plane
 * (so a post's grain runs up the post, and a beam's runs along the beam).
 */
export function texturedBox(size: Vec3, center: Vec3 = [0, 0, 0], options: BoxOptions = {}): BufferGeometry {
  const geometry = new BoxGeometry(size[0], size[1], size[2])
  const grain = options.grain ?? longestAxis(size)
  const [su, sv] = options.uvScale ?? WOOD_UV
  const [ou, ov] = options.uvOffset ?? [0, 0]

  const pos = geometry.attributes.position
  const normal = geometry.attributes.normal
  const uv = geometry.attributes.uv
  const p = [0, 0, 0]
  for (let i = 0; i < pos.count; i++) {
    p[0] = pos.getX(i)
    p[1] = pos.getY(i)
    p[2] = pos.getZ(i)
    const nx = Math.abs(normal.getX(i))
    const ny = Math.abs(normal.getY(i))
    const faceAxis = nx > 0.5 ? 0 : ny > 0.5 ? 1 : 2
    const a = (faceAxis + 1) % 3
    const b = (faceAxis + 2) % 3
    let uAxis: number
    if (grain !== faceAxis) uAxis = grain
    else uAxis = size[a] >= size[b] ? a : b
    const vAxis = uAxis === a ? b : a
    uv.setXY(i, p[uAxis] / su + ou, p[vAxis] / sv + ov)
  }
  uv.needsUpdate = true

  geometry.translate(center[0], center[1], center[2])
  return geometry
}

let unitPlane: PlaneGeometry | null = null

/** A shared 1 × 1 plane facing +Z. Scale the mesh to size it. Never dispose it. */
export function getUnitPlane() {
  return (unitPlane ??= new PlaneGeometry(1, 1))
}

/** Merges geometries into one and disposes the parts. */
export function mergeAndDispose(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts, false)
  for (const part of parts) part.dispose()
  if (!merged) throw new Error('Kit geometry could not be merged')
  return merged
}

/** A random UV offset generator for a piece, stable for a given seed. */
export function uvOffsets(seed: number) {
  const rand = createRandom(seed)
  return (): [number, number] => [rand() * 7, rand() * 7]
}

/** A stable seed from a position, so identical pieces at different places look different. */
export function seedFromPosition(position: Vec3 | undefined): number {
  if (!position) return 1
  const [x, y, z] = position
  return (Math.imul(Math.round(x * 100), 73856093) ^ Math.imul(Math.round(y * 100), 19349663) ^ Math.imul(Math.round(z * 100), 83492791)) >>> 0
}

function longestAxis(size: Vec3): 0 | 1 | 2 {
  if (size[0] >= size[1] && size[0] >= size[2]) return 0
  return size[1] >= size[2] ? 1 : 2
}

/**
 * Splits a non-indexed geometry into two draw groups by face direction: group 0 holds
 * upward-facing triangles (normal.y above `threshold`), group 1 everything else.
 * Lets one mesh use a material array, e.g. tiles on top and wood underneath.
 */
export function splitByUpFacing(source: BufferGeometry, threshold: number): BufferGeometry {
  const geometry = source.index ? source.toNonIndexed() : source
  const names = Object.keys(geometry.attributes)
  const normal = geometry.attributes.normal
  const triCount = normal.count / 3

  const up: number[] = []
  const rest: number[] = []
  for (let t = 0; t < triCount; t++) {
    const ny = (normal.getY(t * 3) + normal.getY(t * 3 + 1) + normal.getY(t * 3 + 2)) / 3
    ;(ny > threshold ? up : rest).push(t)
  }

  const out = new BufferGeometry()
  const order = up.concat(rest)
  for (const name of names) {
    const src = geometry.attributes[name]
    const size = src.itemSize
    const data = new Float32Array(order.length * 3 * size)
    order.forEach((t, j) => {
      for (let k = 0; k < 3 * size; k++) data[j * 3 * size + k] = src.array[t * 3 * size + k]
    })
    out.setAttribute(name, new BufferAttribute(data, size))
  }
  out.addGroup(0, up.length * 3, 0)
  out.addGroup(up.length * 3, rest.length * 3, 1)

  if (geometry !== source) geometry.dispose()
  source.dispose()
  return out
}
