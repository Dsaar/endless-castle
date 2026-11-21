import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import MergedBoxes from '../../scene/kit/MergedBoxes'
import Roof from '../../scene/kit/Roof'
import ShojiInstances from '../../scene/kit/ShojiInstances'
import { buildPavilionLayout, PAVILION_PANEL, type PavilionSpec } from './pavilionLayout'

/** How far a pavilion drifts up and down (meters). */
const BOB = 0.22

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * A small pavilion hanging in the void with nothing holding it up: a platform with struts
 * dangling into the fog, shoji walls (most of them glowing), and a curved kit roof. It drifts
 * gently up and down. No lights of its own, so it costs nothing from the light pool: its
 * wood shows only as a silhouette against its own paper. Six draw calls.
 */
export default function FloatingPavilion({ spec }: { spec: PavilionSpec }) {
  const layout = useMemo(() => buildPavilionLayout(spec), [spec])
  const ref = useRef<Group>(null)
  const still = useRef(reducedMotion())
  const { width: w, depth: d, height: h } = spec

  useFrame(({ clock }) => {
    if (still.current || !ref.current) return
    ref.current.position.y = spec.position[1] + BOB * Math.sin((clock.elapsedTime * Math.PI * 2) / spec.bobPeriod + spec.bobPhase)
  })

  return (
    <group ref={ref} position={spec.position} rotation={[0, spec.yaw, 0]}>
      <MergedBoxes boxes={layout.boxes} seed={spec.seed} />
      <ShojiInstances size={[PAVILION_PANEL, h]} panels={layout.panels} seed={spec.seed} />
      <Roof position={[0, h + 0.3, 0]} size={[w + 1.5, (w + 1.5) * 0.3, d + 1.5]} seed={spec.seed} />
    </group>
  )
}
