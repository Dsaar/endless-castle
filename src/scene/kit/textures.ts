import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { mixCss } from '../../lib/color'
import { createRandom } from '../../lib/random'

/**
 * Canvas-generated textures for the building kit. Each is drawn once, on first use,
 * and shared by every piece. All of them tile seamlessly in both directions.
 */

const TAU = Math.PI * 2

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas unavailable')
  return { canvas, ctx }
}

function toTexture(canvas: HTMLCanvasElement) {
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.anisotropy = 8 // clamped to the GPU's maximum by three
  return texture
}

/** Draws `draw(dy)` at dy = -h, 0, +h so shapes crossing the top or bottom edge wrap around. */
function wrapY(height: number, draw: (dy: number) => void) {
  draw(-height)
  draw(0)
  draw(height)
}

/** Same for the left and right edges. */
function wrapX(width: number, draw: (dx: number) => void) {
  draw(-width)
  draw(0)
  draw(width)
}

/**
 * A wavy line across the full width. Wave frequencies are whole numbers of periods per
 * width, so the line meets itself at the seam.
 */
function grainLine(
  ctx: CanvasRenderingContext2D,
  width: number,
  y: number,
  amp1: number,
  k1: number,
  p1: number,
  amp2: number,
  k2: number,
  p2: number,
) {
  ctx.beginPath()
  for (let x = 0; x <= width; x += 8) {
    const s = x / width
    const yy = y + amp1 * Math.sin(TAU * k1 * s + p1) + amp2 * Math.sin(TAU * k2 * s + p2)
    if (x === 0) ctx.moveTo(x, yy)
    else ctx.lineTo(x, yy)
  }
  ctx.stroke()
}

let wood: CanvasTexture | null = null

/**
 * Cedar wood grain. U runs along the grain: long, slightly wavy streaks in dark red-brown.
 * The texture covers `WOOD_TEXTURE_METERS` in world units (see geometry.ts).
 */
export function getWoodTexture() {
  if (wood) return wood
  const W = 1024
  const H = 256
  const { canvas, ctx } = makeCanvas(W, H)
  const rand = createRandom(101)

  ctx.fillStyle = mixCss('cedarDark', 'cedarLight', 0.5)
  ctx.fillRect(0, 0, W, H)

  // Broad, soft bands: growth-ring variation seen on a plain-sawn face.
  for (let i = 0; i < 16; i++) {
    const y = rand() * H
    const dark = rand() < 0.55
    ctx.strokeStyle = dark ? mixCss('void', 'cedarDark', 0.55, 0.22) : mixCss('cedarLight', 'lantern', 0.08, 0.16)
    ctx.lineWidth = 6 + rand() * 22
    const a1 = 2 + rand() * 6
    const k1 = 1 + Math.floor(rand() * 2)
    const p1 = rand() * TAU
    wrapY(H, (dy) => grainLine(ctx, W, y + dy, a1, k1, p1, 1.5, 3, rand() * TAU))
  }

  // Fine streaks: the long grain lines that read from up close.
  for (let i = 0; i < 280; i++) {
    const y = rand() * H
    const dark = rand() < 0.65
    const alpha = 0.08 + rand() * 0.3
    ctx.strokeStyle = dark ? mixCss('void', 'cedarDark', 0.35, alpha) : mixCss('cedarLight', 'lantern', 0.15, alpha * 0.8)
    ctx.lineWidth = 0.5 + rand() * 1.8
    const a1 = 1 + rand() * 4
    const k1 = 1 + Math.floor(rand() * 3)
    const p1 = rand() * TAU
    const a2 = rand() * 1.5
    const k2 = 4 + Math.floor(rand() * 5)
    const p2 = rand() * TAU
    wrapY(H, (dy) => grainLine(ctx, W, y + dy, a1, k1, p1, a2, k2, p2))
  }

  // Pores: short dark dashes along the grain.
  for (let i = 0; i < 2200; i++) {
    const x = rand() * W
    const y = rand() * H
    const len = 3 + rand() * 18
    ctx.fillStyle = mixCss('void', 'cedarDark', 0.3, 0.12 + rand() * 0.25)
    wrapX(W, (dx) => ctx.fillRect(x + dx, y, len, 0.8 + rand()))
  }

  wood = toTexture(canvas)
  return wood
}

let tatami: CanvasTexture | null = null

/**
 * Tatami surface (igusa rush). U runs along the mat's long side; each rush stalk is a thin
 * column across the mat, and the hemp warp threads show as faint lines along the length.
 * The texture covers 0.5 m × 0.5 m.
 */
export function getTatamiTexture() {
  if (tatami) return tatami
  const S = 512
  const { canvas, ctx } = makeCanvas(S, S)
  const rand = createRandom(202)

  ctx.fillStyle = mixCss('shoji', 'cedarLight', 0.42)
  ctx.fillRect(0, 0, S, S)

  // Rush stalks: 4 px columns (about 4 mm), each with its own tone.
  const stalk = 4
  for (let x = 0; x < S; x += stalk) {
    const t = rand()
    ctx.fillStyle = t < 0.5 ? mixCss('cedarDark', 'shoji', 0.4, 0.18 * (1 - t)) : mixCss('shoji', 'lantern', 0.2, 0.2 * t)
    ctx.fillRect(x, 0, stalk, S)
    ctx.fillStyle = mixCss('void', 'cedarDark', 0.5, 0.22)
    ctx.fillRect(x + stalk - 1, 0, 1, S)
  }

  // Warp threads: faint lines along the mat every ~2 cm.
  for (let y = 10; y < S; y += 21) {
    ctx.fillStyle = mixCss('void', 'cedarDark', 0.4, 0.16)
    ctx.fillRect(0, y, S, 2)
  }

  // A little mottling so large floors don't look printed.
  for (let i = 0; i < 400; i++) {
    const x = rand() * S
    const y = rand() * S
    const r = 6 + rand() * 30
    ctx.fillStyle = mixCss('cedarDark', 'shoji', rand() * 0.6, 0.04)
    wrapX(S, (dx) => wrapY(S, (dy) => ctx.fillRect(x + dx - r, y + dy - r, r * 2, r * 2)))
  }

  tatami = toTexture(canvas)
  return tatami
}

let paper: CanvasTexture | null = null

/** Washi paper: shoji cream with faint fibres. Used as both color and emissive map. */
export function getPaperTexture() {
  if (paper) return paper
  const S = 256
  const { canvas, ctx } = makeCanvas(S, S)
  const rand = createRandom(303)

  ctx.fillStyle = mixCss('shoji', 'shoji', 0)
  ctx.fillRect(0, 0, S, S)

  for (let i = 0; i < 260; i++) {
    const x = rand() * S
    const y = rand() * S
    const len = 6 + rand() * 26
    const angle = rand() * TAU
    ctx.strokeStyle = rand() < 0.5 ? mixCss('shoji', 'cedarLight', 0.25, 0.2) : mixCss('shoji', 'lantern', 0.3, 0.25)
    ctx.lineWidth = 0.5 + rand() * 0.8
    wrapX(S, (dx) =>
      wrapY(S, (dy) => {
        ctx.beginPath()
        ctx.moveTo(x + dx, y + dy)
        ctx.quadraticCurveTo(
          x + dx + Math.cos(angle + 0.6) * len * 0.5,
          y + dy + Math.sin(angle + 0.6) * len * 0.5,
          x + dx + Math.cos(angle) * len,
          y + dy + Math.sin(angle) * len,
        )
        ctx.stroke()
      }),
    )
  }

  paper = toTexture(canvas)
  return paper
}

let roofTile: CanvasTexture | null = null

/**
 * Roof tiles. U runs along the ridge; each 128 px column is one row of rounded tiles running
 * down the slope, and the horizontal steps are where each course overlaps the next.
 * The texture covers 0.6 m × 0.6 m.
 */
export function getRoofTileTexture() {
  if (roofTile) return roofTile
  const S = 256
  const { canvas, ctx } = makeCanvas(S, S)

  ctx.fillStyle = mixCss('void', 'shoji', 0.06)
  ctx.fillRect(0, 0, S, S)

  // Two rounded tile rows per texture: a highlight down the middle, shadow at the seams.
  const col = S / 2
  for (let x = 0; x < S; x += col) {
    const g = ctx.createLinearGradient(x, 0, x + col, 0)
    g.addColorStop(0, mixCss('void', 'shoji', 0.02))
    g.addColorStop(0.18, mixCss('void', 'shoji', 0.09))
    g.addColorStop(0.45, mixCss('void', 'shoji', 0.2))
    g.addColorStop(0.75, mixCss('void', 'shoji', 0.1))
    g.addColorStop(1, mixCss('void', 'shoji', 0.015))
    ctx.fillStyle = g
    ctx.fillRect(x, 0, col, S)
  }

  // Course lines: each tile's lower lip casts a thin shadow on the one below.
  for (let y = 0; y < S; y += S / 2) {
    const g = ctx.createLinearGradient(0, y, 0, y + 14)
    g.addColorStop(0, mixCss('void', 'void', 0, 0.85))
    g.addColorStop(1, mixCss('void', 'void', 0, 0))
    ctx.fillStyle = g
    ctx.fillRect(0, y, S, 14)
  }

  roofTile = toTexture(canvas)
  return roofTile
}
