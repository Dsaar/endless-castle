import { BoxGeometry, BufferAttribute, PlaneGeometry } from 'three'
import { CAP_SHAPE, ROOF_SHAPE } from '../../world/distant/towerDesign'
import { flaredRoof } from '../flaredRoof'

/**
 * Geometry for the distant castle. Each instanced mesh gets its own copy, because the
 * per-instance attributes live on the geometry.
 */

/** Light from nowhere in particular: tops dimmer than walls, undersides darkest, one pair of walls a shade darker. */
const FACE_SHADE = { x: 0.78, y: 0.5, yDown: 0.32, z: 1 }

/** A unit box (centered) with its faces shaded by vertex color, so unlit stories still read as solids. */
export function createShadedBox() {
  const geometry = new BoxGeometry(1, 1, 1)
  const normal = geometry.attributes.normal
  const colors = new Float32Array(normal.count * 3)
  for (let i = 0; i < normal.count; i++) {
    const nx = normal.getX(i)
    const ny = normal.getY(i)
    const shade = Math.abs(nx) > 0.5 ? FACE_SHADE.x : ny > 0.5 ? FACE_SHADE.y : ny < -0.5 ? FACE_SHADE.yDown : FACE_SHADE.z
    colors.fill(shade, i * 3, i * 3 + 3)
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  return geometry
}

/** A 1 × 1 window facing +Z. */
export function createWindowQuad() {
  return new PlaneGeometry(1, 1)
}

/** The unit roof of every story but the top one (eave half-width 1). */
export function createStoryRoof() {
  return flaredRoof(ROOF_SHAPE)
}

/** The pointed unit roof on the top story. */
export function createCapRoof() {
  return flaredRoof(CAP_SHAPE)
}
