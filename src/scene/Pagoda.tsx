import { BoxGeometry, Color, CylinderGeometry, DoubleSide, InstancedMesh, MeshBasicMaterial, Object3D, type BufferGeometry } from 'three'
import { mixPalette } from '../lib/color'
import { createRandom } from '../lib/random'
import { applyDistantHaze, type DistantHazeOptions } from './distantHaze'
import { flaredRoof } from './flaredRoof'
import { getUnitPlane, mergeAndDispose } from './kit/geometry'
import type { Vec3 } from './kit/types'
import { useDisposable } from './kit/useDisposable'

export interface PagodaProps {
  /** Center of the base. */
  position?: Vec3
  /** Turn about the vertical axis, in radians. */
  rotationY?: number
  tiers?: number
  /** Width of the lowest story, in meters. */
  baseWidth?: number
  /** Height of the lowest story; upper stories get shorter. */
  tierHeight?: number
  /** Which windows are lit. */
  seed?: number
}

/**
 * Far landmarks get a thinner haze than the scene fog, so they stay faintly visible as
 * grids of lit windows, and a fog bank swallows their bases.
 */
const HAZE: DistantHazeOptions = { densityScale: 0.5, bankBottom: -8, bankTop: 6 }
const WINDOW_BRIGHTNESS = 3.2
const ROOF_SEGMENTS = 48

let materials: { body: MeshBasicMaterial; roof: MeshBasicMaterial; window: MeshBasicMaterial } | null = null

/**
 * Unlit materials: at this distance no lantern reaches, so lighting would only cost.
 * Shared by every pagoda.
 */
function getMaterials() {
  return (materials ??= {
    body: applyDistantHaze(
      new MeshBasicMaterial({ name: 'pagoda/body', color: mixPalette('void', 'cedarDark', 0.45) }),
      HAZE,
    ),
    roof: applyDistantHaze(new MeshBasicMaterial({ name: 'pagoda/roof', vertexColors: true, side: DoubleSide }), HAZE),
    window: applyDistantHaze(
      new MeshBasicMaterial({
        name: 'pagoda/window',
        color: mixPalette('lantern', 'shoji', 0.3).multiplyScalar(WINDOW_BRIGHTNESS),
      }),
      HAZE,
    ),
  })
}

/**
 * A distant multi-story pagoda: square stories narrowing upward, each under a flared roof
 * with swept-up corners, and a spire with rings on top. Every story has a grid of windows
 * on all four sides, most of them lit. Three draw calls: body, roofs, windows (instanced).
 */
export default function Pagoda({
  position,
  rotationY = 0,
  tiers = 5,
  baseWidth = 11,
  tierHeight = 6,
  seed = 1,
}: PagodaProps) {
  const geo = useDisposable(() => buildPagoda(tiers, baseWidth, tierHeight, seed), [tiers, baseWidth, tierHeight, seed])
  const m = getMaterials()

  return (
    <group position={position} rotation-y={rotationY}>
      <mesh geometry={geo.body} material={m.body} />
      <mesh geometry={geo.roofs} material={m.roof} />
      <primitive object={geo.windows} />
    </group>
  )
}

interface PagodaGeometry {
  body: BufferGeometry
  roofs: BufferGeometry
  windows: InstancedMesh
  dispose: () => void
}

function buildPagoda(tiers: number, baseWidth: number, tierHeight: number, seed: number): PagodaGeometry {
  const rand = createRandom(seed)
  const bodyParts: BufferGeometry[] = []
  const roofParts: BufferGeometry[] = []
  const windowSpots: { x: number; y: number; z: number; ry: number; w: number; h: number }[] = []

  const widthAt = (i: number) => baseWidth * (1 - 0.11 * i)
  const heightAt = (i: number) => tierHeight * (1 - 0.07 * i)

  // Stone-like plinth.
  const plinth = new BoxGeometry(baseWidth * 1.25, 1.6, baseWidth * 1.25)
  plinth.translate(0, -0.8, 0)
  bodyParts.push(plinth)

  let y = 0
  let roofBelow = 0
  for (let i = 0; i < tiers; i++) {
    const w = widthAt(i)
    const h = heightAt(i)
    const body = new BoxGeometry(w, h, w)
    body.translate(0, y + h / 2, 0)
    bodyParts.push(body)

    // Windows: a grid on each face, above the roof of the story below.
    const cols = Math.max(2, Math.floor(w / 1.55))
    const usable = w * 0.78
    const winW = Math.min(0.8, (usable / cols) * 0.6)
    const winH = 1.05
    const bottom = y + roofBelow + 0.5
    const rowYs = [bottom + (h - roofBelow) * 0.22, bottom + (h - roofBelow) * 0.56]
    for (let f = 0; f < 4; f++) {
      const ry = (f * Math.PI) / 2
      for (const wy of rowYs) {
        for (let c = 0; c < cols; c++) {
          const u = -usable / 2 + (usable * (c + 0.5)) / cols
          const d = w / 2 + 0.03
          // Face f's outward normal is (sin ry, 0, cos ry); u runs along its right-hand axis.
          windowSpots.push({
            x: Math.sin(ry) * d + Math.cos(ry) * u,
            y: wy,
            z: Math.cos(ry) * d - Math.sin(ry) * u,
            ry,
            w: winW,
            h: winH,
          })
        }
      }
    }

    y += h
    const top = i === tiers - 1
    const halfIn = top ? w * 0.08 : widthAt(i + 1) / 2
    const halfOut = w / 2 + w * 0.3
    const rise = (halfOut - halfIn) * (top ? 0.7 : 0.45)
    const roof = flaredRoof({ halfIn, halfWall: w / 2, halfOut, rise, lift: rise * 0.45, thick: 0.28, segments: ROOF_SEGMENTS })
    roof.translate(0, y, 0)
    roofParts.push(roof)
    roofBelow = rise
  }

  // Spire (sōrin): a mast with nine rings and a finial.
  const spireBase = y + roofBelow - 0.2
  const mastHeight = 9
  const mast = new CylinderGeometry(0.12, 0.16, mastHeight, 8)
  mast.translate(0, spireBase + mastHeight / 2, 0)
  bodyParts.push(mast)
  for (let r = 0; r < 9; r++) {
    const ring = new CylinderGeometry(0.5 - r * 0.02, 0.5 - r * 0.02, 0.12, 12)
    ring.translate(0, spireBase + 1.4 + r * 0.55, 0)
    bodyParts.push(ring)
  }
  const finial = new CylinderGeometry(0, 0.3, 1.1, 8)
  finial.translate(0, spireBase + mastHeight + 0.4, 0)
  bodyParts.push(finial)

  const windows = new InstancedMesh(getUnitPlane(), getMaterials().window, windowSpots.length)
  const dummy = new Object3D()
  const tint = new Color()
  windowSpots.forEach((s, i) => {
    dummy.position.set(s.x, s.y, s.z)
    dummy.rotation.set(0, s.ry, 0)
    dummy.scale.set(s.w, s.h, 1)
    dummy.updateMatrix()
    windows.setMatrixAt(i, dummy.matrix)
    // Most windows lit, with some variation; a few dark.
    const b = rand() < 0.16 ? 0.04 : 0.5 + rand() * 0.5
    windows.setColorAt(i, tint.setScalar(b))
  })

  const body = mergeAndDispose(bodyParts)
  const roofs = mergeAndDispose(roofParts)
  return {
    body,
    roofs,
    windows,
    dispose: () => {
      body.dispose()
      roofs.dispose()
      windows.dispose()
    },
  }
}
