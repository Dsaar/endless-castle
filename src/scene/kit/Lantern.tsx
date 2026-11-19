import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BoxGeometry, type BufferGeometry, type Mesh, type MeshStandardMaterial, type PointLight } from 'three'
import { palette } from '../../lib/palette'
import { mergeAndDispose, texturedBox, uvOffsets } from './geometry'
import { getLanternPaperMaterial, getWoodMaterial, LANTERN_PAPER_INTENSITY } from './materials'
import type { KitTransform } from './types'

export type LanternKind = 'hanging' | 'standing'

export interface LanternProps extends Omit<KitTransform, 'seed'> {
  /**
   * `hanging`: a box lantern on a cord; `position` is the center of the lantern body.
   * `standing`: a floor lantern (andon) on legs; `position` is the center of its base.
   */
  kind?: LanternKind
  /** Uniform scale. 1 is a 0.32 m wide body. The light's reach does not scale. */
  size?: number
  /** Cord length above a hanging lantern, in meters (before scaling). */
  cord?: number
  /** Point light intensity (candela). */
  intensity?: number
  /** Gently varies the light and paper glow. */
  flicker?: boolean
  /** Offsets the flicker so neighbouring lanterns don't pulse together. */
  phase?: number
}

const LIGHT_DISTANCE = 6
const LIGHT_DECAY = 2
const BAR = 0.024

interface LanternShape {
  frame: BufferGeometry
  paper: BufferGeometry
  /** Height of the light (center of the paper) above the piece's origin. */
  lightY: number
}

const shapes: Partial<Record<LanternKind, LanternShape>> = {}

/** Built once per kind and shared by every lantern of that kind. */
function getShape(kind: LanternKind): LanternShape {
  return (shapes[kind] ??= kind === 'hanging' ? buildHanging() : buildStanding())
}

/** Adds a square ring of four bars at height y, outside a body `w` wide. */
function ring(parts: BufferGeometry[], off: () => [number, number], w: number, y: number, bar = BAR) {
  const half = w / 2 + bar / 2
  parts.push(texturedBox([w + bar * 2, bar, bar], [0, y, half], { uvOffset: off() }))
  parts.push(texturedBox([w + bar * 2, bar, bar], [0, y, -half], { uvOffset: off() }))
  parts.push(texturedBox([bar, bar, w], [half, y, 0], { uvOffset: off() }))
  parts.push(texturedBox([bar, bar, w], [-half, y, 0], { uvOffset: off() }))
}

/** Adds four corner posts from y0 to y1, outside a body `w` wide. */
function corners(parts: BufferGeometry[], off: () => [number, number], w: number, y0: number, y1: number, bar = BAR) {
  const half = w / 2 + bar / 2
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      parts.push(texturedBox([bar, y1 - y0, bar], [sx * half, (y0 + y1) / 2, sz * half], { uvOffset: off() }))
    }
  }
}

/** Thin bars across the middle of each paper face, like a simple lattice. */
function faceBars(parts: BufferGeometry[], off: () => [number, number], w: number, y: number) {
  const t = BAR * 0.45
  const half = w / 2 + t / 2
  parts.push(texturedBox([w, t, t], [0, y, half], { uvOffset: off() }))
  parts.push(texturedBox([w, t, t], [0, y, -half], { uvOffset: off() }))
  parts.push(texturedBox([t, t, w], [half, y, 0], { uvOffset: off() }))
  parts.push(texturedBox([t, t, w], [-half, y, 0], { uvOffset: off() }))
}

function buildHanging(): LanternShape {
  const W = 0.3
  const H = 0.4
  const off = uvOffsets(11)
  const parts: BufferGeometry[] = []
  corners(parts, off, W, -H / 2 - BAR, H / 2 + BAR)
  ring(parts, off, W, H / 2 + BAR / 2)
  ring(parts, off, W, -H / 2 - BAR / 2)
  faceBars(parts, off, W, 0)
  // Cap: a wide plate with a smaller block on top, and a hook block.
  parts.push(texturedBox([W + 0.12, 0.03, W + 0.12], [0, H / 2 + BAR + 0.015, 0], { uvOffset: off() }))
  parts.push(texturedBox([W * 0.55, 0.035, W * 0.55], [0, H / 2 + BAR + 0.045, 0], { uvOffset: off() }))
  parts.push(texturedBox([0.04, 0.04, 0.04], [0, H / 2 + BAR + 0.08, 0], { uvOffset: off() }))
  return { frame: mergeAndDispose(parts), paper: new BoxGeometry(W, H, W), lightY: 0 }
}

function buildStanding(): LanternShape {
  const W = 0.32
  const H = 0.5
  const BASE = 0.3 // paper starts this high off the floor
  const LEG = 0.034
  const off = uvOffsets(23)
  const parts: BufferGeometry[] = []
  corners(parts, off, W, 0, BASE + H + 0.06, LEG)
  ring(parts, off, W, BASE - LEG / 2, LEG) // shelf rim under the paper
  ring(parts, off, W, BASE + H + LEG / 2, LEG)
  ring(parts, off, W, 0.06, LEG * 0.8) // low stretcher between the legs
  faceBars(parts, off, W, BASE + H * 0.5)
  // Shelf the paper box rests on.
  parts.push(texturedBox([W, 0.02, W], [0, BASE - 0.01, 0], { uvOffset: off() }))
  // Carrying handle: two uprights and a crossbar.
  const top = BASE + H + 0.06
  parts.push(texturedBox([0.022, 0.12, 0.022], [-W / 2 + 0.04, top + 0.06, 0], { uvOffset: off() }))
  parts.push(texturedBox([0.022, 0.12, 0.022], [W / 2 - 0.04, top + 0.06, 0], { uvOffset: off() }))
  parts.push(texturedBox([W - 0.04, 0.024, 0.03], [0, top + 0.13, 0], { uvOffset: off() }))
  const paper = new BoxGeometry(W, H, W)
  paper.translate(0, BASE + H / 2, 0)
  return { frame: mergeAndDispose(parts), paper, lightY: BASE + H / 2 }
}

/**
 * A paper lantern with one point light inside (distance 6, decay 2). Frame and paper
 * geometry are shared per kind; a flickering lantern gets its own copy of the paper
 * material (same shader program) so its glow can pulse with its light.
 */
export default function Lantern({
  position,
  rotation,
  kind = 'hanging',
  size = 1,
  cord = 0.8,
  intensity = 10,
  flicker = true,
  phase = 0,
}: LanternProps) {
  const shape = getShape(kind)
  const lightRef = useRef<PointLight>(null)
  const paperRef = useRef<Mesh>(null)

  // Only a flickering lantern needs its own material; the clone shares the shader program.
  const ownMaterial = useMemo(() => (flicker ? getLanternPaperMaterial().clone() : null), [flicker])
  useEffect(() => () => ownMaterial?.dispose(), [ownMaterial])
  const paperMaterial = ownMaterial ?? getLanternPaperMaterial()

  useFrame(({ clock }) => {
    if (!flicker || !lightRef.current || !paperRef.current) return
    const t = clock.elapsedTime + phase * 7.31
    // Layered sines: a slow breath, a quicker waver and a fast shimmer.
    const f =
      1 + 0.07 * Math.sin(t * 1.7) + 0.06 * Math.sin(t * 6.3 + 1.3) + 0.035 * Math.sin(t * 17.9 + 0.4) + 0.02 * Math.sin(t * 31.3)
    lightRef.current.intensity = intensity * f
    ;(paperRef.current.material as MeshStandardMaterial).emissiveIntensity = LANTERN_PAPER_INTENSITY * (0.75 + 0.25 * f)
  })

  return (
    <group position={position} rotation={rotation} scale={size}>
      <mesh geometry={shape.frame} material={getWoodMaterial()} />
      <mesh ref={paperRef} geometry={shape.paper} material={paperMaterial} />
      {kind === 'hanging' && cord > 0 && (
        // Unit-height shared cord, scaled to length.
        <mesh geometry={getCordGeometry()} material={getWoodMaterial()} position={[0, 0.3, 0]} scale={[1, cord, 1]} />
      )}
      <pointLight
        ref={lightRef}
        position={[0, shape.lightY, 0]}
        color={palette.lantern}
        intensity={intensity}
        distance={LIGHT_DISTANCE}
        decay={LIGHT_DECAY}
      />
    </group>
  )
}

let cordGeometry: BufferGeometry | null = null

/** A thin cord, 1 m tall, rising from y = 0. Shared by every hanging lantern. */
function getCordGeometry() {
  if (!cordGeometry) {
    cordGeometry = new BoxGeometry(0.012, 1, 0.012)
    cordGeometry.translate(0, 0.5, 0)
  }
  return cordGeometry
}
