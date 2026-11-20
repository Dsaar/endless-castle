import { useMemo } from 'react'
import { AdditiveBlending, CanvasTexture, Color } from 'three'
import { palette } from '../../../lib/palette'
import { getUnitPlane } from '../../../scene/kit/geometry'
import type { Vec3 } from '../../../scene/kit/types'

interface GateBackGlowProps {
  /** Center of the glow. */
  position: Vec3
  /** [width, height] in meters. */
  size: [number, number]
  /** Peak brightness. Kept low: it should only lift the black behind the roof. */
  strength?: number
}

let mask: CanvasTexture | null = null

/** A soft elliptical falloff, drawn once. */
function getMask() {
  if (mask) return mask
  const S = 256
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas unavailable')
  const image = ctx.createImageData(S, S)
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = ((x + 0.5) / S) * 2 - 1
      const dy = ((y + 0.5) / S) * 2 - 1
      const d = Math.min(1, Math.hypot(dx, dy))
      // Smooth to zero at the edge so the plane never shows.
      const v = Math.pow(1 - d * d, 2.5)
      const i = (y * S + x) * 4
      const g = Math.round(v * 255)
      image.data[i] = g
      image.data[i + 1] = g
      image.data[i + 2] = g
      image.data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  mask = new CanvasTexture(canvas)
  return mask
}

/**
 * A faint warm haze behind the gate, as if the castle beyond were lit. Its only job is to
 * lift the black just enough that the roof's curve reads as a silhouette. Additive, unlit,
 * and outside the fog (its distance is already baked into its strength).
 */
export default function GateBackGlow({ position, size, strength = 0.12 }: GateBackGlowProps) {
  const color = useMemo(() => new Color(palette.lantern).multiplyScalar(strength), [strength])
  return (
    <mesh geometry={getUnitPlane()} position={position} scale={[size[0], size[1], 1]} renderOrder={-1}>
      <meshBasicMaterial
        color={color}
        alphaMap={getMask()}
        transparent
        blending={AdditiveBlending}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  )
}
