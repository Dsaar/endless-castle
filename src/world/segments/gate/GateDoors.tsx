import { useCallback, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { Color, MeshBasicMaterial, type BufferGeometry, type Group, type Mesh } from 'three'
import { palette } from '../../../lib/palette'
import { getUnitPlane, mergeAndDispose, texturedBox, uvOffsets } from '../../../scene/kit/geometry'
import { getWoodMaterial } from '../../../scene/kit/materials'
import { useDisposable } from '../../../scene/kit/useDisposable'
import WoodBeam from '../../../scene/kit/WoodBeam'
import type { Vec3 } from '../../../scene/kit/types'
import PooledLight from '../../../scene/lighting/PooledLight'
import { useProgressTrigger } from '../../useProgressTrigger'
import DoorLightSpill from './DoorLightSpill'
import { getSpillMaterial } from './doorSpillMaterial'

interface GateDoorsProps {
  /** Bottom center of the opening, on the post line. */
  position: Vec3
  /** Clear width of the opening. */
  width: number
  /** Height of the opening, floor to the underside of the head rail. */
  height: number
  /** Progress along the walk at which the doors swing open. */
  openAt: number
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
/** How far each leaf swings in (radians), and how long it takes. */
const OPEN_ANGLE = (98 * Math.PI) / 180
const OPEN_DURATION = 2.6

/**
 * The gate's heavy board doors: two leaves on a sill and head rail, with a bright light behind
 * them leaking through the slit between the leaves, the gaps between boards and the gaps at
 * the top and bottom. A spill light and a streak on the floor carry the leak out onto the landing.
 *
 * When the player comes within about 9 m, both leaves swing inward on their outer hinges
 * (GSAP) while the light behind them fades away, opening the way into the castle.
 */
export default function GateDoors({ position, width, height, openAt }: GateDoorsProps) {
  const [x, y, z] = position
  const left = useDisposable(() => buildLeaf(-1, width, height), [width, height])
  const right = useDisposable(() => buildLeaf(1, width, height), [width, height])
  const glow = useDisposable(
    () =>
      new MeshBasicMaterial({
        name: 'gate/door-glow',
        color: new Color(palette.lantern).multiplyScalar(GLOW),
        transparent: true,
      }),
    [],
  )
  const leftRef = useRef<Group>(null)
  const rightRef = useRef<Group>(null)
  const glowRef = useRef<Mesh>(null)
  const tween = useRef<gsap.core.Timeline | null>(null)

  const open = useCallback(
    (immediate: boolean) => {
      const l = leftRef.current
      const r = rightRef.current
      const glow = glowRef.current?.material as MeshBasicMaterial | undefined
      if (!l || !r || !glow) return
      const spill = getSpillMaterial()
      tween.current?.kill()
      if (immediate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        l.rotation.y = OPEN_ANGLE
        r.rotation.y = -OPEN_ANGLE
        glow.opacity = 0
        spill.opacity = 0
        return
      }
      // A slow, heavy swing: a little hesitation, then the weight carries the leaves round.
      tween.current = gsap
        .timeline()
        .to(l.rotation, { y: OPEN_ANGLE, duration: OPEN_DURATION, ease: 'power2.inOut' }, 0)
        .to(r.rotation, { y: -OPEN_ANGLE, duration: OPEN_DURATION, ease: 'power2.inOut' }, 0.08)
        .to(glow, { opacity: 0, duration: 0.9, ease: 'power1.out' }, 0.1)
        .to(spill, { opacity: 0, duration: 1.4, ease: 'power1.out' }, 0.1)
    },
    [],
  )
  useProgressTrigger(openAt, open)

  // The spill material is shared; put it back if the gate remounts closed.
  useEffect(() => {
    getSpillMaterial().opacity = 1
    return () => {
      tween.current?.kill()
      tween.current = null
    }
  }, [])

  return (
    <group position={[x, y, z]}>
      <WoodBeam position={[0, SILL / 2, 0]} size={[width, SILL, 0.24]} />
      <WoodBeam position={[0, height + HEAD_RAIL / 2, 0]} size={[width, HEAD_RAIL, 0.24]} />
      {/* Each leaf turns about its outer edge (its hinge). */}
      <group ref={leftRef} position={[-width / 2, 0, 0]}>
        <mesh geometry={left} material={getWoodMaterial()} />
      </group>
      <group ref={rightRef} position={[width / 2, 0, 0]}>
        <mesh geometry={right} material={getWoodMaterial()} />
      </group>

      {/* The lit room behind the doors, seen only through the gaps. */}
      <mesh
        ref={glowRef}
        geometry={getUnitPlane()}
        material={glow}
        position={[0, SILL + (height - SILL) / 2, -0.09]}
        scale={[width, height - SILL, 1]}
      />

      <PooledLight position={[0, 0.45, 0.4]} intensity={3} distance={5} />
      <DoorLightSpill width={width} />
    </group>
  )
}

/**
 * One leaf, in hinge space (its outer edge at x = 0): vertical boards with small gaps,
 * battens across the front, and a stile on the meeting edge. `side` -1 is the left leaf.
 */
function buildLeaf(side: -1 | 1, width: number, height: number): BufferGeometry {
  const off = uvOffsets(side < 0 ? 41 : 43)
  const parts: BufferGeometry[] = []
  const leafW = (width - CENTER_SLIT) / 2
  const bottom = SILL + BOTTOM_GAP
  const top = height - TOP_GAP
  const h = top - bottom
  const boardW = (leafW - BOARD_GAP * (BOARDS_PER_LEAF - 1)) / BOARDS_PER_LEAF
  const hinge = side * (width / 2)
  const inner = side * (CENTER_SLIT / 2)
  const center = (inner + hinge) / 2

  for (let i = 0; i < BOARDS_PER_LEAF; i++) {
    const bx = inner + side * (boardW / 2 + i * (boardW + BOARD_GAP))
    parts.push(texturedBox([boardW, h, BOARD_DEPTH], [bx - hinge, bottom + h / 2, 0], { grain: 1, uvOffset: off() }))
  }
  // Battens on the front face, plus a stile on the meeting edge, hold the boards together.
  for (const t of [0.06, 0.5, 0.94]) {
    parts.push(
      texturedBox([leafW, BATTEN, 0.035], [center - hinge, bottom + h * t, BOARD_DEPTH / 2 + 0.0175], {
        grain: 0,
        uvOffset: off(),
      }),
    )
  }
  parts.push(
    texturedBox([0.07, h, 0.03], [inner + side * 0.035 - hinge, bottom + h / 2, BOARD_DEPTH / 2 + 0.015], {
      grain: 1,
      uvOffset: off(),
    }),
  )
  return mergeAndDispose(parts)
}
