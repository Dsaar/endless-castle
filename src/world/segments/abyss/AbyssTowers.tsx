import { useMemo } from 'react'
import {
  BoxGeometry,
  Color,
  DoubleSide,
  Euler,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type Material,
} from 'three'
import { mixPalette } from '../../../lib/color'
import { palette } from '../../../lib/palette'
import { createShadedBox, createStoryRoof } from '../../../scene/distant/distantGeometry'
import { applyDistantHaze, type DistantHazeOptions } from '../../../scene/distantHaze'
import { getUnitPlane } from '../../../scene/kit/geometry'
import { useDisposable } from '../../../scene/kit/useDisposable'
import { buildTowerLayout, type AbyssParams, type TowerPiece } from './layout'

/**
 * A thinner haze than the scene fog, so the towers 40 to 150 m out stay faintly visible as
 * lit windows and lanterns, and fade out far up and far down. No fog bank: the towers have no
 * bottom to hide.
 */
const HAZE: DistantHazeOptions = { densityScale: 0.3, bankBottom: -1e6, bankTop: -1e6 + 1 }
const WINDOW_BRIGHTNESS = 3.2
const LANTERN_BRIGHTNESS = 4.5

let materials: { body: Material; roof: Material; window: Material; lantern: Material } | null = null

/** Unlit: no lantern's light reaches this far, so lighting would only cost. Shared by every abyss. */
function getMaterials() {
  return (materials ??= {
    body: applyDistantHaze(
      new MeshBasicMaterial({ name: 'abyss/body', color: mixPalette('void', 'cedarDark', 0.55), vertexColors: true }),
      HAZE,
    ),
    roof: applyDistantHaze(new MeshBasicMaterial({ name: 'abyss/roof', vertexColors: true, side: DoubleSide }), HAZE),
    window: applyDistantHaze(
      new MeshBasicMaterial({
        name: 'abyss/window',
        color: mixPalette('lantern', 'shoji', 0.35).multiplyScalar(WINDOW_BRIGHTNESS),
        side: DoubleSide,
      }),
      HAZE,
    ),
    lantern: applyDistantHaze(
      new MeshBasicMaterial({ name: 'abyss/lantern', color: new Color(palette.lantern).multiplyScalar(LANTERN_BRIGHTNESS) }),
      HAZE,
    ),
  })
}

const matrix = new Matrix4()
const position = new Vector3()
const quaternion = new Quaternion()
const euler = new Euler(0, 0, 0, 'YXZ')
const scale = new Vector3()
const tint = new Color()

/** One instanced mesh for a list of pieces (yaw, then pitch, as everywhere in the kit). */
function instances(geometry: BufferGeometry, material: Material, pieces: readonly TowerPiece[], tinted: boolean) {
  const mesh = new InstancedMesh(geometry, material, Math.max(1, pieces.length))
  mesh.count = pieces.length
  pieces.forEach((p, i) => {
    position.set(p.position[0], p.position[1], p.position[2])
    quaternion.setFromEuler(euler.set(p.pitch ?? 0, p.yaw ?? 0, 0, 'YXZ'))
    if (p.scale) scale.set(p.scale[0], p.scale[1], p.scale[2])
    else scale.set(1, 1, 1)
    mesh.setMatrixAt(i, matrix.compose(position, quaternion, scale))
    if (tinted) mesh.setColorAt(i, tint.setScalar(p.shade ?? 1))
  })
  mesh.instanceMatrix.needsUpdate = true
  mesh.computeBoundingSphere()
  return mesh
}

/**
 * The ring of towers round the Central Abyss: every story, roof, window and lantern of all of
 * them in four instanced draw calls, unlit and in a thin haze.
 */
export default function AbyssTowers({ params }: { params: AbyssParams }) {
  const layout = useMemo(() => buildTowerLayout(params), [params])
  const built = useDisposable(() => {
    const m = getMaterials()
    const box = createShadedBox()
    const roof = createStoryRoof()
    const lantern = new BoxGeometry(0.3, 0.4, 0.3)
    const meshes = [
      instances(box, m.body, layout.boxes, false),
      instances(roof, m.roof, layout.roofs, false),
      instances(getUnitPlane(), m.window, layout.windows, true),
      instances(lantern, m.lantern, layout.lanterns, false),
    ]
    return {
      meshes,
      dispose: () => {
        for (const mesh of meshes) mesh.dispose()
        box.dispose()
        roof.dispose()
        lantern.dispose()
      },
    }
  }, [layout])

  return (
    <group>
      {built.meshes.map((mesh) => (
        <primitive key={mesh.uuid} object={mesh} />
      ))}
    </group>
  )
}
