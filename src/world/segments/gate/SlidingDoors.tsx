import { Color, MeshBasicMaterial, type BufferGeometry } from 'three'
import { palette } from '../../../lib/palette'
import { getUnitPlane, mergeAndDispose, texturedBox, uvOffsets } from '../../../scene/kit/geometry'
import { getWoodMaterial } from '../../../scene/kit/materials'
import { useDisposable } from '../../../scene/kit/useDisposable'
import WoodBeam from '../../../scene/kit/WoodBeam'
import type { Vec3 } from '../../../scene/kit/types'
import DoorLightSpill from './DoorLightSpill'

interface SlidingDoorsProps {
  /** Bottom center of the opening, on the post line. */
  position: Vec3
  /** Clear width of the opening. */
  width: number
  /** Height of the opening, floor to the underside of the head rail. */
  height: number
}

const SILL = 0.06
/** Gaps light leaks through. */
const CENTER_SLIT = 0.035
const BOTTOM_GAP = 0.04
const TOP_GAP = 0.03
const BOARD_GAP = 0.012
const BOARDS_PER_LEAF = 3
const BOARD_DEPTH = 0.05
const BATTEN = 0.11
const HEAD_RAIL = 0.3
/** How bright the light behind the doors is (above 1 so the slits bloom). */
const GLOW = 5

/**
 * The gate's closed central doors: two heavy board leaves on a sill and head rail, with a
 * bright light behind them leaking through the slit between the leaves, the gaps between
 * boards and the gaps at the top and bottom. A spill light and a streak on the floor carry
 * the leak out onto the landing.
 */
export default function SlidingDoors({ position, width, height }: SlidingDoorsProps) {
  const [x, y, z] = position
  const leaves = useDisposable(() => buildLeaves(width, height), [width, height])
  const glow = useDisposable(
    () => new MeshBasicMaterial({ name: 'gate/door-glow', color: new Color(palette.lantern).multiplyScalar(GLOW) }),
    [],
  )

  return (
    <group position={[x, y, z]}>
      <WoodBeam position={[0, SILL / 2, 0]} size={[width, SILL, 0.24]} />
      <WoodBeam position={[0, height + HEAD_RAIL / 2, 0]} size={[width, HEAD_RAIL, 0.24]} />
      <mesh geometry={leaves} material={getWoodMaterial()} />

      {/* The lit room behind the doors, seen only through the gaps. */}
      <mesh
        geometry={getUnitPlane()}
        material={glow}
        position={[0, SILL + (height - SILL) / 2, -0.09]}
        scale={[width, height - SILL, 1]}
      />

      <pointLight position={[0, 0.45, 0.4]} color={palette.lantern} intensity={3} distance={5} decay={2} />
      <DoorLightSpill width={width} />
    </group>
  )
}

/** Both leaves as one mesh: vertical boards with small gaps, battens across the front. */
function buildLeaves(width: number, height: number): BufferGeometry {
  const off = uvOffsets(41)
  const parts: BufferGeometry[] = []
  const leafW = (width - CENTER_SLIT) / 2
  const bottom = SILL + BOTTOM_GAP
  const top = height - TOP_GAP
  const h = top - bottom
  const boardW = (leafW - BOARD_GAP * (BOARDS_PER_LEAF - 1)) / BOARDS_PER_LEAF

  for (const side of [-1, 1]) {
    const inner = side * (CENTER_SLIT / 2)
    const outer = side * (width / 2)
    const center = (inner + outer) / 2
    for (let i = 0; i < BOARDS_PER_LEAF; i++) {
      const bx = inner + side * (boardW / 2 + i * (boardW + BOARD_GAP))
      parts.push(texturedBox([boardW, h, BOARD_DEPTH], [bx, bottom + h / 2, 0], { grain: 1, uvOffset: off() }))
    }
    // Battens on the front face, plus a stile on the meeting edge, hold the boards together.
    for (const t of [0.06, 0.5, 0.94]) {
      parts.push(
        texturedBox([leafW, BATTEN, 0.035], [center, bottom + h * t, BOARD_DEPTH / 2 + 0.0175], {
          grain: 0,
          uvOffset: off(),
        }),
      )
    }
    parts.push(
      texturedBox([0.07, h, 0.03], [inner + side * 0.035, bottom + h / 2, BOARD_DEPTH / 2 + 0.015], {
        grain: 1,
        uvOffset: off(),
      }),
    )
  }
  return mergeAndDispose(parts)
}
