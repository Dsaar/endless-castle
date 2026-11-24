import { useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { WalkClearance } from '../../world/distant/walkClearance'
import type { WorldGenerator } from '../../world/WorldGenerator'
import { distantCastleStats } from '../frameStats'
import { useDisposable } from '../kit/useDisposable'
import { DistantCastleSystem } from './DistantCastleSystem'
import { distantTime } from './distantMaterial'

interface DistantCastleProps {
  /** Seeds the pieces, and tells them which heights the walk needs clear. */
  generator: WorldGenerator
}

/**
 * The vast castle around the walk: floating towers and rooms in every direction, 40 to
 * 300 m out, generated in cells around the camera and recycled as it moves. Four draw calls.
 * See `DistantCastleSystem` for how.
 */
export default function DistantCastle({ generator }: DistantCastleProps) {
  const system = useDisposable(() => new DistantCastleSystem(generator.seed), [generator])
  const [clearance] = useState(() => new WalkClearance())

  useFrame(({ camera, clock }) => {
    const time = clock.elapsedTime
    distantTime.value = time
    const changed = clearance.update(generator)
    system.update(camera.position, time, clearance, changed)
    if (import.meta.env.DEV) {
      const s = system.stats
      distantCastleStats.pieces = s.pieces
      distantCastleStats.near = s.near
      distantCastleStats.queued = s.queued
      distantCastleStats.ms = s.ms
      distantCastleStats.peakMs = s.peakMs
    }
  })

  return (
    <group>
      {system.meshes.map((mesh) => (
        <primitive key={mesh.uuid} object={mesh} />
      ))}
    </group>
  )
}
