import { AdditiveBlending, CanvasTexture, Color, MeshBasicMaterial } from 'three'
import { palette } from '../../../lib/palette'

/** How far the streak reaches out from the doors. */
export const SPILL_LENGTH = 3.4

let material: MeshBasicMaterial | null = null

/**
 * Shared additive material for the light streak in front of the gate doors; the mask is drawn
 * once on a small canvas. `GateDoors` fades its opacity when the doors open.
 */
export function getSpillMaterial() {
  return (material ??= new MeshBasicMaterial({
    name: 'gate/door-spill',
    color: new Color(palette.lantern).multiplyScalar(0.9),
    alphaMap: drawMask(),
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  }))
}

/**
 * Grey-scale mask (the alpha map reads the green channel). The top row is the door end:
 * a thin wedge from the center slit that widens and fades, over a soft band from the
 * gap under the doors.
 */
function drawMask() {
  const W = 128
  const H = 256
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas unavailable')
  const image = ctx.createImageData(W, H)

  for (let r = 0; r < H; r++) {
    const v = r / (H - 1)
    const spread = 0.025 + 0.4 * v
    const fade = Math.pow(1 - v, 2.2)
    const band = Math.exp(-v * 14) * 0.3
    for (let c = 0; c < W; c++) {
      const u = ((c + 0.5) / W) * 2 - 1
      const wedge = Math.exp(-((u / spread) ** 2)) * fade
      // The band tapers toward the door jambs.
      const edge = Math.min(1, (1 - Math.abs(u)) * 6)
      const value = Math.min(1, wedge + band * edge)
      const i = (r * W + c) * 4
      const g = Math.round(value * 255)
      image.data[i] = g
      image.data[i + 1] = g
      image.data[i + 2] = g
      image.data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  return new CanvasTexture(canvas)
}
