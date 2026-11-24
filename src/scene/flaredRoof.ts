import { BufferAttribute, LatheGeometry, Vector2 } from 'three'
import { mixPalette } from '../lib/color'

const SQRT2 = Math.SQRT2

export interface FlaredRoofShape {
  /** Half-width where the top surface meets the story above (the top of the slope). */
  halfIn: number
  /** Half-width of the wall underneath, where the soffit ends. */
  halfWall: number
  /** Half-width at the eave tips. */
  halfOut: number
  /** Height of the top of the slope above the eave tips. */
  rise: number
  /** How far the corners sweep up. */
  lift: number
  /** Thickness at the eave. */
  thick: number
  /** Lathe segments around: a multiple of 8, so there is a vertex on every corner. */
  segments: number
  /** Points down the slope of the profile (12 by default). */
  steps?: number
  /** Brightness of the warm glow on the underside (0.55 by default). */
  soffitGlow?: number
}

/**
 * A square hip roof with concave slopes and upturned corners, lathed from a profile and then
 * squared off. The top surface rises from the eave tips (y = 0, half-width `halfOut`) to the
 * next story's wall (`halfIn`, y = `rise`); the underside runs back to this story's wall at
 * `halfWall`. Vertex colors: dark tiles on top, a faint warm glow underneath from the windows.
 * Unlit far scenery only (the pagodas, the distant castle): the normals are rough.
 */
export function flaredRoof({ halfIn, halfWall, halfOut, rise, lift, thick, segments, steps = 12, soffitGlow = 0.55 }: FlaredRoofShape) {
  const pts: Vector2[] = []
  for (let i = 0; i <= steps; i++) {
    const s = i / steps
    pts.push(new Vector2(halfIn + (halfOut - halfIn) * s, rise * Math.pow(1 - s, 1.7)))
  }
  const topCount = pts.length
  pts.push(new Vector2(halfOut, -thick))
  pts.push(new Vector2(halfWall, 0))
  pts.push(new Vector2(halfIn * 0.5, 0))

  const geometry = new LatheGeometry(pts, segments)
  const pos = geometry.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const dark = mixPalette('void', 'cedarDark', 0.12)
  const glow = mixPalette('cedarDark', 'lantern', 0.4).multiplyScalar(soffitGlow)

  for (let v = 0; v < pos.count; v++) {
    const x = pos.getX(v)
    const z = pos.getZ(v)
    const r = Math.hypot(x, z)
    // Circle → square: push each ring out to a square of half-width r.
    const phi = Math.atan2(x, z)
    const k = 1 / Math.max(Math.abs(Math.sin(phi)), Math.abs(Math.cos(phi)))
    pos.setX(v, x * k)
    pos.setZ(v, z * k)
    // Sweep the corners up, more toward the eaves.
    const corner = ((k - 1) / (SQRT2 - 1)) ** 3
    const out = Math.min(1, Math.max(0, (r - halfIn) / (halfOut - halfIn)))
    pos.setY(v, pos.getY(v) + lift * corner * out * out)

    const c = v % pts.length < topCount ? dark : glow
    colors[v * 3] = c.r
    colors[v * 3 + 1] = c.g
    colors[v * 3 + 2] = c.b
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  return geometry
}
