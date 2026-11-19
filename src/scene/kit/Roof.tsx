import { useMemo } from 'react'
import { ExtrudeGeometry, Shape, Vector2, type BufferGeometry } from 'three'
import { mergeAndDispose, seedFromPosition, splitByUpFacing, texturedBox, uvOffsets } from './geometry'
import { getRoofTileMaterial, getWoodMaterial } from './materials'
import type { KitTransform, Vec3 } from './types'
import { useDisposable } from './useDisposable'

export interface RoofProps extends KitTransform {
  /**
   * [width across the slopes (x), rise to the ridge (y), length along the ridge (z)] in meters.
   * `position` is under the middle of the ridge, at the height of the eave tips.
   */
  size?: Vec3
}

const PROFILE_STEPS = 28 // per slope
const LENGTH_STEPS = 36
/** Roof tile texture footprint in meters (along the ridge, down the slope). */
const TILE_UV = 0.6

interface RoofGeometry {
  shell: BufferGeometry
  ridge: BufferGeometry
  dispose: () => void
}

/**
 * A gabled temple roof. The cross-section is steep at the ridge and flattens toward the
 * eaves, with a small upturn at the tips; it is extruded along the ridge, then bent so the
 * four corners sweep upward (sori). Tiles on top, cedar on the underside and the gable
 * ends (one mesh, two material groups), plus a ridge cap with end blocks.
 */
export default function Roof({ position, rotation, size = [5, 1.6, 4], seed }: RoofProps) {
  const [w, h, d] = size
  const s = seed ?? seedFromPosition(position)
  const geo = useDisposable(() => buildRoof(w, h, d, s), [w, h, d, s])
  // Group 0 (up-facing) gets tiles, group 1 (underside, gable ends) gets cedar.
  const materials = useMemo(() => [getRoofTileMaterial(), getWoodMaterial()], [])

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geo.shell} material={materials} />
      <mesh geometry={geo.ridge} material={getRoofTileMaterial()} />
    </group>
  )
}

function buildRoof(width: number, rise: number, length: number, seed: number): RoofGeometry {
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
