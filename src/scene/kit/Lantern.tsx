import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh, MeshStandardMaterial } from 'three'
import type { LightSource } from '../lighting/lightSources'
import PooledLight from '../lighting/PooledLight'
import { gutterPaperFor } from '../signs/lanternGutter'
import { lanternFlicker, paperGlow } from './flicker'
import { CORD_BASE, getCordGeometry, getLanternShape, LANTERN_LIGHT_DISTANCE, type LanternKind } from './lanternGeometry'
import { getLanternPaperMaterial, getWoodMaterial, LANTERN_PAPER_INTENSITY } from './materials'
import type { KitTransform } from './types'

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

/**
 * A paper lantern with a warm light inside (distance 6, decay 2), borrowed from the
 * `LightPool`. Frame and paper geometry are shared per kind; a flickering lantern gets its
 * own copy of the paper material (same shader program) so its glow can pulse with its light.
 * For rows of lanterns, `LanternInstances` draws them all in a few draw calls.
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
  const shape = getLanternShape(kind)
  const paperRef = useRef<Mesh>(null)
  const sourceRef = useRef<LightSource | null>(null)

  // Only a flickering lantern needs its own material; the clone shares the shader program.
  const ownMaterial = useMemo(() => (flicker ? getLanternPaperMaterial().clone() : null), [flicker])
  useEffect(() => () => ownMaterial?.dispose(), [ownMaterial])
  const paperMaterial = ownMaterial ?? getLanternPaperMaterial()

  useFrame(({ clock }) => {
    if (!flicker || !paperRef.current) return
    const f = lanternFlicker(clock.elapsedTime, phase)
    // A guttering lantern's paper dims with its light.
    ;(paperRef.current.material as MeshStandardMaterial).emissiveIntensity =
      LANTERN_PAPER_INTENSITY * paperGlow(f) * gutterPaperFor(sourceRef.current)
  })

  return (
    <group position={position} rotation={rotation} scale={size}>
      <mesh geometry={shape.frame} material={getWoodMaterial()} />
      <mesh ref={paperRef} geometry={shape.paper} material={paperMaterial} />
      {kind === 'hanging' && cord > 0 && (
        // Unit-height shared cord, scaled to length.
        <mesh geometry={getCordGeometry()} material={getWoodMaterial()} position={[0, CORD_BASE, 0]} scale={[1, cord, 1]} />
      )}
      <PooledLight
        position={[0, shape.lightY, 0]}
        intensity={intensity}
        distance={LANTERN_LIGHT_DISTANCE}
        flicker={flicker}
        phase={phase}
        sourceRef={sourceRef}
      />
    </group>
  )
}
