import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import type { Group } from 'three'
import FloatingStairs from './FloatingStairs'
import HangingPillars from './HangingPillars'
import InvertedRooms from './InvertedRooms'
import LitTowers from './LitTowers'
import { buildShaftLayout } from './shaftLayout'

/**
 * Everything the player falls past (see `shaftLayout.ts`): about 30 draw calls in all. Its
 * shaders are compiled as soon as it mounts (on the Threshold), not when the pieces first
 * come into view mid-fall.
 */
export default function FallShaft({ seed }: { seed: number }) {
  const layout = useMemo(() => buildShaftLayout(seed), [seed])
  const groupRef = useRef<Group>(null)
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    if (groupRef.current) void gl.compileAsync(groupRef.current, camera, scene)
  }, [gl, camera, scene])

  return (
    <group ref={groupRef}>
      <LitTowers towers={layout.towers} seed={seed} />
      <InvertedRooms rooms={layout.rooms} seed={seed + 10} />
      <HangingPillars pillars={layout.pillars} seed={seed + 20} />
      <FloatingStairs stairs={layout.stairs} seed={seed + 30} />
    </group>
  )
}
