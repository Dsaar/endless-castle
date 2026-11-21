import { useLayoutEffect, useRef } from 'react'
import { Vector3, type Group } from 'three'
import type { Vec3 } from '../kit/types'
import { addLightSources } from './lightSources'

interface PooledLightProps {
  /** Local position; the light source is registered at its world position on mount. */
  position?: Vec3
  intensity: number
  distance?: number
  flicker?: boolean
  phase?: number
}

/**
 * A warm point light that borrows one of `LightPool`'s lights when it is among the nearest.
 * Use it instead of `<pointLight>` for anything that mounts and unmounts with the world.
 * The parent transforms must not move after mount.
 */
export default function PooledLight({ position = [0, 0, 0], intensity, distance = 6, flicker = false, phase = 0 }: PooledLightProps) {
  const ref = useRef<Group>(null)
  const [x, y, z] = position

  useLayoutEffect(() => {
    const group = ref.current
    if (!group) return
    group.updateWorldMatrix(true, false)
    const p = new Vector3().setFromMatrixPosition(group.matrixWorld)
    return addLightSources([{ x: p.x, y: p.y, z: p.z, intensity, distance, flicker, phase }])
  }, [x, y, z, intensity, distance, flicker, phase])

  return <group ref={ref} position={[x, y, z]} />
}
