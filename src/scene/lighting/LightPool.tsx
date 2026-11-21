import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, type PointLight } from 'three'
import { palette } from '../../lib/palette'
import { smoothstep } from '../../lib/math'
import { lanternFlicker } from '../kit/flicker'
import { getLightSources } from './lightSources'

/** How many real point lights exist. Fixed for the whole session, so shaders compile once. */
export const LIGHT_POOL_SIZE = 10
/** Sources scoring further than this are never lit (meters, see `score`). */
const MAX_REACH = 26
/** A light fades out over this many meters before it would be handed to another source. */
const FADE_BAND = 5
/** Sources behind the camera count up to this much further away. */
const BEHIND_PENALTY = 0.6

const forward = new Vector3()
// Best candidates, nearest first. One extra slot remembers the first source left out.
const bestIndex = new Int32Array(LIGHT_POOL_SIZE + 1)
const bestScore = new Float32Array(LIGHT_POOL_SIZE + 1)

/**
 * A fixed pool of point lights, handed each frame to the registered light sources nearest
 * the camera (sources ahead win over sources behind). A light fades to nothing as its source
 * approaches the edge of the chosen set, so a hand-over between sources is never visible.
 * Mounted once per canvas. No allocations in the frame loop.
 */
export default function LightPool() {
  const lights = useRef<(PointLight | null)[]>([])

  useFrame(({ camera, clock }) => {
    const sources = getLightSources()
    const cam = camera.position
    camera.getWorldDirection(forward)
    const t = clock.elapsedTime

    let count = 0
    for (let i = 0; i < sources.length; i++) {
      const s = sources[i]
      const dx = s.x - cam.x
      const dy = s.y - cam.y
      const dz = s.z - cam.z
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz)
      const cos = d > 1e-4 ? (dx * forward.x + dy * forward.y + dz * forward.z) / d : 1
      const score = d * (1 + BEHIND_PENALTY * Math.max(0, -cos))
      if (score > MAX_REACH) continue
      if (count === LIGHT_POOL_SIZE + 1 && score >= bestScore[LIGHT_POOL_SIZE]) continue
      // Insertion sort into the short list.
      let j = count < LIGHT_POOL_SIZE + 1 ? count++ : LIGHT_POOL_SIZE
      while (j > 0 && bestScore[j - 1] > score) {
        bestScore[j] = bestScore[j - 1]
        bestIndex[j] = bestIndex[j - 1]
        j--
      }
      bestScore[j] = score
      bestIndex[j] = i
    }

    // Lights fade out as they near the first source that missed the cut (or the reach limit).
    const cutoff = count > LIGHT_POOL_SIZE ? bestScore[LIGHT_POOL_SIZE] : MAX_REACH
    const lit = Math.min(count, LIGHT_POOL_SIZE)
    for (let k = 0; k < LIGHT_POOL_SIZE; k++) {
      const light = lights.current[k]
      if (!light) continue
      if (k >= lit) {
        light.intensity = 0
        continue
      }
      const s = sources[bestIndex[k]]
      const fade = smoothstep(cutoff, cutoff - FADE_BAND, bestScore[k])
      light.position.set(s.x, s.y, s.z)
      light.distance = s.distance
      light.intensity = s.intensity * fade * (s.flicker ? lanternFlicker(t, s.phase) : 1)
    }
  })

  return (
    <>
      {Array.from({ length: LIGHT_POOL_SIZE }, (_, i) => (
        <pointLight
          key={i}
          ref={(light) => {
            lights.current[i] = light
          }}
          color={palette.lantern}
          intensity={0}
          distance={6}
          decay={2}
        />
      ))}
    </>
  )
}
