import { ExtrudeGeometry, Shape, Vector2, type BufferGeometry } from 'three'
import { mergeAndDispose, splitByUpFacing, texturedBox, uvOffsets } from './geometry'

const PROFILE_STEPS = 28 // per slope
const LENGTH_STEPS = 36
/** Roof tile texture footprint in meters (along the ridge, down the slope). */
const TILE_UV = 0.6

export interface RoofGeometry {
  shell: BufferGeometry
  ridge: BufferGeometry
  dispose: () => void
}

/**
 * A gabled temple roof, [width across the slopes, rise to the ridge, length along the ridge]
 * in meters, with its origin under the middle of the ridge at the height of the eave tips.
 * The shell has two material groups: 0 for the tiles on top, 1 for the cedar underneath.
 */
export function buildRoof(width: number, rise: number, length: number, seed: number): RoofGeometry {
  const hw = width / 2
  const hl = length / 2
  const thick = Math.max(0.12, width * 0.03)
  const tipLift = rise * 0.08
  const cornerLift = rise * 0.15

  // Height of the top surface at t = |x| / hw. Concave, plus a lift right at the tip.
  const top = (t: number) => {
    const flick = Math.max(0, (t - 0.82) / 0.18)
    return rise * Math.pow(1 - t, 1.35) + tipLift * flick * flick
  }
  // The shell thins toward the eaves.
  const thickness = (t: number) => thick * (1 - 0.45 * t)

  const pts: Vector2[] = []
  for (let i = -PROFILE_STEPS; i <= PROFILE_STEPS; i++) {
    const t = Math.abs(i) / PROFILE_STEPS
    pts.push(new Vector2((i / PROFILE_STEPS) * hw, top(t)))
  }
  for (let i = PROFILE_STEPS; i >= -PROFILE_STEPS; i--) {
    const t = Math.abs(i) / PROFILE_STEPS
    pts.push(new Vector2((i / PROFILE_STEPS) * hw, top(t) - thickness(t)))
  }
  const extruded = new ExtrudeGeometry(new Shape(pts), {
    depth: length,
    steps: LENGTH_STEPS,
    bevelEnabled: false,
  })
  extruded.translate(0, 0, -hl)

  // Bend: lift the eaves toward the corners, and write UVs (U along the ridge, V down the slope).
  const pos = extruded.attributes.position
  const uv = extruded.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const tx = Math.abs(x) / hw
    const tz = Math.abs(z) / hl
    pos.setY(i, pos.getY(i) + cornerLift * tz * tz * tz * tx * tx)
    uv.setXY(i, z / TILE_UV, Math.abs(x) / TILE_UV)
  }
  extruded.computeVertexNormals()
  const shell = splitByUpFacing(extruded, 0.2)

  // Ridge cap and end blocks (onigawara).
  const off = uvOffsets(seed)
  const rw = Math.max(0.18, width * 0.045)
  const ridgeParts = [
    texturedBox([rw, rw * 1.1, length + rw], [0, rise + rw * 0.3, 0], { grain: 2, uvOffset: off() }),
    texturedBox([rw * 1.6, rw * 2.2, rw * 0.7], [0, rise + rw * 0.8, hl + rw * 0.2], { uvOffset: off() }),
    texturedBox([rw * 1.6, rw * 2.2, rw * 0.7], [0, rise + rw * 0.8, -hl - rw * 0.2], { uvOffset: off() }),
  ]
  const ridge = mergeAndDispose(ridgeParts)

  return {
    shell,
    ridge,
    dispose: () => {
      shell.dispose()
      ridge.dispose()
    },
  }
}
