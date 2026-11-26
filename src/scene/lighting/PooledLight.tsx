import { useLayoutEffect, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, type Group } from 'three'
import { useSegmentMotion } from '../../world/shift/segmentMotion'
import type { Vec3 } from '../kit/types'
import { addLightSources, type LightSource } from './lightSources'

interface PooledLightProps {
  /** Local position; the light source is registered at its world position on mount. */
  position?: Vec3
  intensity: number
  distance?: number
  flicker?: boolean
  phase?: number
  /** Set to the registered source while mounted (a lantern's paper reads it to gutter with it). */
  sourceRef?: RefObject<LightSource | null>
}

/**
 * A warm point light that borrows one of `LightPool`'s lights when it is among the nearest.
 * Use it instead of `<pointLight>` for anything that mounts and unmounts with the world.
 * The parent transforms must not move after mount, except as a whole segment in a room shift:
 * then the light follows (`useSegmentMotion`).
 */
export default function PooledLight({
  position = [0, 0, 0],
  intensity,
  distance = 6,
  flicker = false,
  phase = 0,
  sourceRef,
}: PooledLightProps) {
  const ref = useRef<Group>(null)
  const source = useRef<LightSource | null>(null)
  const followed = useRef(-1)
  const motion = useSegmentMotion()
  const [x, y, z] = position

  useLayoutEffect(() => {
    const group = ref.current
    if (!group) return
    group.updateWorldMatrix(true, false)
    const p = new Vector3().setFromMatrixPosition(group.matrixWorld)
    const s: LightSource = { x: p.x, y: p.y, z: p.z, intensity, distance, flicker, phase }
    source.current = s
    if (sourceRef) sourceRef.current = s
    followed.current = -1
    const remove = addLightSources([s])
    return () => {
      remove()
      if (sourceRef?.current === s) sourceRef.current = null
    }
  }, [x, y, z, intensity, distance, flicker, phase, sourceRef])

  useFrame(() => {
    const s = source.current
    const group = ref.current
    if (!motion || !s || !group || followed.current === motion.tick) return
    followed.current = motion.tick
    group.updateWorldMatrix(true, false)
    s.x = group.matrixWorld.elements[12]
    s.y = group.matrixWorld.elements[13]
    s.z = group.matrixWorld.elements[14]
    s.intensity = intensity * motion.light
  })

  return <group ref={ref} position={[x, y, z]} />
}
