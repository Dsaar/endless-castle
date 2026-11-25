import { CanvasTexture, SRGBColorSpace } from 'three'
import { mixCss } from '../../lib/color'
import type { FigurePose } from '../../world/figures'
import { FIGURE_HEIGHT, FIGURE_WIDTH } from './tuning'

/**
 * Placeholder silhouettes for the hidden figures, drawn on canvas: robed figures in six poses,
 * near-black on transparent. Drawn in meters with y up, feet at y = 0, across the
 * FIGURE_WIDTH × FIGURE_HEIGHT plane.
 */

const PX = 256
const WIDTH = FIGURE_WIDTH * PX
const HEIGHT = FIGURE_HEIGHT * PX

type Ctx = CanvasRenderingContext2D

/** Fills SVG path data (in meters). */
function fill(ctx: Ctx, d: string) {
  ctx.fill(new Path2D(d))
}

/** Fills the path, and its mirror image across the figure's middle. */
function fillBoth(ctx: Ctx, d: string) {
  const path = new Path2D(d)
  ctx.fill(path)
  ctx.save()
  ctx.scale(-1, 1)
  ctx.fill(path)
  ctx.restore()
}

function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, rotation = 0) {
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2)
  ctx.fill()
}

/** A long robe, narrow at the shoulders and spreading to the hem, the shoulders rounded over. */
function robe(ctx: Ctx, hem: number, shoulder: number, shoulderY: number, hunch = 0.06) {
  fill(
    ctx,
    `M ${-hem} 0
     C ${-hem * 0.96} 0.5, ${-shoulder - 0.04} ${shoulderY - 0.55}, ${-shoulder} ${shoulderY}
     Q 0 ${shoulderY + hunch * 2}, ${shoulder} ${shoulderY}
     C ${shoulder + 0.04} ${shoulderY - 0.55}, ${hem * 0.96} 0.5, ${hem} 0
     Q 0 -0.02, ${-hem} 0 Z`,
  )
}

/** A hood rising to a soft point over the head. */
function hood(ctx: Ctx, shoulderY: number, top: number) {
  fill(
    ctx,
    `M -0.19 ${shoulderY}
     C -0.21 ${shoulderY + 0.2}, -0.12 ${top - 0.03}, 0 ${top}
     C 0.12 ${top - 0.03}, 0.21 ${shoulderY + 0.2}, 0.19 ${shoulderY} Z`,
  )
}

/** A wide kimono sleeve hanging from the left shoulder down to `bottom` (mirror it for the right). */
const SLEEVE = (bottom: number) => `M -0.18 1.40
  C -0.29 1.36, -0.33 1.18, -0.33 ${bottom + 0.1}
  L -0.32 ${bottom}
  Q -0.25 ${bottom - 0.03}, -0.17 ${bottom + 0.03}
  L -0.16 1.2 Z`

const POSES: Record<FigurePose, (ctx: Ctx) => void> = {
  /** Hooded, arms at the sides, long sleeves hanging. */
  standing: (ctx) => {
    robe(ctx, 0.3, 0.2, 1.42)
    hood(ctx, 1.4, 1.8)
    fillBoth(ctx, SLEEVE(0.76))
  },

  /** A wide conical hat, hands hidden in the sleeves, which stand out like wings. */
  kasa: (ctx) => {
    robe(ctx, 0.29, 0.19, 1.38)
    ellipse(ctx, 0, 1.5, 0.08, 0.1)
    fill(ctx, 'M -0.42 1.55 Q -0.2 1.63, 0 1.79 Q 0.2 1.63, 0.42 1.55 Q 0 1.5, -0.42 1.55 Z')
    fillBoth(ctx, 'M -0.18 1.36 C -0.31 1.31, -0.36 1.15, -0.36 0.92 Q -0.27 0.86, -0.17 0.93 Z')
  },

  /** Hooded, a tall ringed staff in the right hand. */
  staff: (ctx) => {
    robe(ctx, 0.28, 0.19, 1.42)
    hood(ctx, 1.4, 1.79)
    fill(ctx, SLEEVE(0.78))
    // The right arm out to the staff, its sleeve hanging under it.
    fill(ctx, 'M 0.16 1.4 C 0.27 1.34, 0.32 1.22, 0.34 1.11 L 0.28 1.05 C 0.23 1.15, 0.19 1.2, 0.15 1.22 Z')
    fill(ctx, 'M 0.19 1.32 C 0.3 1.22, 0.33 1.06, 0.32 0.9 Q 0.26 0.87, 0.21 0.95 Z')
    ellipse(ctx, 0.34, 1.08, 0.04, 0.05)
    ctx.fillRect(0.325, 0, 0.035, 1.9)
    ctx.lineWidth = 0.025
    ctx.beginPath()
    ctx.ellipse(0.3425, 1.9, 0.06, 0.075, 0, 0, Math.PI * 2)
    ctx.stroke()
  },

  /** Head tilted, the left arm raised high, its sleeve falling from it. */
  reaching: (ctx) => {
    robe(ctx, 0.3, 0.19, 1.42)
    ellipse(ctx, 0.03, 1.55, 0.085, 0.105, -0.25)
    // Long hair down the back of the head.
    fill(ctx, 'M -0.06 1.62 C -0.12 1.5, -0.13 1.42, -0.12 1.32 L 0.12 1.34 C 0.13 1.42, 0.12 1.52, 0.1 1.6 Z')
    // The arm up and out, and its wide sleeve fallen back from the wrist, bellying under the arm.
    fill(ctx, 'M -0.15 1.45 L -0.33 1.84 L -0.39 1.81 L -0.23 1.37 Z')
    fill(ctx, 'M -0.3 1.76 C -0.42 1.68, -0.45 1.5, -0.38 1.36 C -0.33 1.3, -0.26 1.3, -0.19 1.36 L -0.22 1.42 Z')
    ellipse(ctx, -0.365, 1.86, 0.03, 0.045, 0.4)
    ctx.save()
    ctx.scale(-1, 1)
    fill(ctx, SLEEVE(0.76))
    ctx.restore()
  },

  /** Hunched, the head sunk low between the shoulders, limp sleeves hanging almost to the knee. */
  bowed: (ctx) => {
    robe(ctx, 0.3, 0.22, 1.4, 0.09)
    ellipse(ctx, 0, 1.44, 0.09, 0.1)
    // Hair falling forward over the face, ragged at the ends.
    fill(ctx, 'M -0.1 1.48 C -0.13 1.3, -0.12 1.14, -0.09 1.02 L -0.05 1.08 L -0.02 0.98 L 0.02 1.07 L 0.06 0.99 L 0.09 1.04 C 0.12 1.16, 0.13 1.3, 0.1 1.48 Z')
    fillBoth(ctx, 'M -0.2 1.39 C -0.33 1.31, -0.37 1.02, -0.36 0.56 Q -0.3 0.5, -0.22 0.57 L -0.2 1 Z')
  },

  /** An open parasol tipped over the head, held at the chest. */
  parasol: (ctx) => {
    robe(ctx, 0.28, 0.18, 1.38)
    ellipse(ctx, 0, 1.5, 0.08, 0.1)
    fill(ctx, SLEEVE(0.8))
    fill(ctx, 'M 0.15 1.37 C 0.13 1.26, 0.09 1.21, 0.05 1.19 L 0.08 1.12 C 0.15 1.17, 0.22 1.25, 0.21 1.37 Z')
    ctx.save()
    ctx.translate(0.04, 1.2)
    ctx.rotate(-0.12)
    ctx.fillRect(-0.012, -0.05, 0.024, 0.72)
    fill(
      ctx,
      `M -0.4 0.52 Q -0.28 0.74, 0 0.78 Q 0.28 0.74, 0.4 0.52
       Q 0.34 0.5, 0.27 0.54 Q 0.2 0.49, 0.13 0.53 Q 0.06 0.48, 0 0.53
       Q -0.06 0.48, -0.13 0.53 Q -0.2 0.49, -0.27 0.54 Q -0.34 0.5, -0.4 0.52 Z`,
    )
    ctx.restore()
  },
}

const silhouettes = new Map<FigurePose, CanvasTexture>()

/** The silhouette's ink: all but the void, a breath of cedar so it isn't flat black. */
const INK = () => mixCss('void', 'cedarDark', 0.12)

/** The silhouette for `pose`. Drawn once per pose, then shared. */
export function getSilhouetteTexture(pose: FigurePose): CanvasTexture {
  let texture = silhouettes.get(pose)
  if (!texture) {
    const canvas = document.createElement('canvas')
    canvas.width = WIDTH
    canvas.height = HEIGHT
    const ctx = canvas.getContext('2d')!
    // Meters, y up, feet at the bottom middle.
    ctx.setTransform(PX, 0, 0, -PX, WIDTH / 2, HEIGHT)
    ctx.fillStyle = INK()
    ctx.strokeStyle = INK()
    POSES[pose](ctx)
    texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 4
    silhouettes.set(pose, texture)
  }
  return texture
}

/**
 * Where each pose's eyes are (the middle between them, meters) and how its head tilts
 * (radians, + turns counterclockwise as drawn). Under the kasa's brim, deep in the hoods, and
 * peering through the bowed figure's hair.
 */
const EYES: Record<FigurePose, { x: number; y: number; tilt: number }> = {
  standing: { x: 0, y: 1.6, tilt: 0 },
  kasa: { x: 0, y: 1.5, tilt: 0 },
  staff: { x: 0, y: 1.59, tilt: 0 },
  reaching: { x: 0.035, y: 1.555, tilt: 0.25 },
  bowed: { x: 0, y: 1.41, tilt: 0 },
  parasol: { x: 0, y: 1.51, tilt: 0 },
}
/** Half the distance between the eyes, and each slit's half length and half height (meters). */
const EYE_SPREAD = 0.034
const SLIT: [number, number] = [0.02, 0.0045]
/** The outer corners lift a little. */
const SLANT = 0.18
/** The halo round each slit, in canvas pixels (unaffected by the drawing's scale). */
const EYE_HALO = 5

const eyes = new Map<FigurePose, CanvasTexture>()

/**
 * Two narrow eye slits for `pose`, in a faint paper-white with a soft halo, on a transparent
 * canvas the same size and frame as its silhouette, so it lays straight over it.
 */
export function getEyesTexture(pose: FigurePose): CanvasTexture {
  let texture = eyes.get(pose)
  if (!texture) {
    const canvas = document.createElement('canvas')
    canvas.width = WIDTH
    canvas.height = HEIGHT
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(PX, 0, 0, -PX, WIDTH / 2, HEIGHT)
    const { x, y, tilt } = EYES[pose]
    const light = mixCss('shoji', 'uiText', 0.4)
    ctx.fillStyle = light
    ctx.shadowColor = light
    for (const side of [-1, 1]) {
      const cx = x + side * EYE_SPREAD * Math.cos(tilt)
      const cy = y + side * EYE_SPREAD * Math.sin(tilt)
      // Twice: the first pass lays the halo, the second sharpens the slit inside it.
      for (const blur of [EYE_HALO, 0]) {
        ctx.shadowBlur = blur
        ctx.beginPath()
        ctx.ellipse(cx, cy, SLIT[0], SLIT[1], tilt + side * SLANT, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    eyes.set(pose, texture)
  }
  return texture
}

let glow: CanvasTexture | null = null

/** A soft round vermilion glow, bright in the middle and gone well before the edge. */
export function getGlowTexture(): CanvasTexture {
  if (!glow) {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const r = size / 2
    const gradient = ctx.createRadialGradient(r, r, 0, r, r, r)
    for (const [stop, alpha] of [[0, 1], [0.2, 0.7], [0.42, 0.3], [0.65, 0.08], [0.85, 0.015], [1, 0]]) {
      gradient.addColorStop(stop, mixCss('vermilion', 'vermilion', 0, alpha))
    }
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    glow = new CanvasTexture(canvas)
    glow.colorSpace = SRGBColorSpace
  }
  return glow
}
