import type { BufferGeometry } from 'three'
import { mergeAndDispose, texturedBox, uvOffsets } from './geometry'

const STILE = 0.045
const DEPTH = 0.032
const BAR = 0.013
const BAR_DEPTH = 0.022
const KICK_HEIGHT = 0.24
const CELL_W = 0.22
const CELL_H = 0.27

/** Where the paper sits in a panel `w` × `h`: its bottom edge, width and height. */
export function shojiPaperRect(w: number, h: number, kickboard: boolean) {
  const bottom = kickboard ? KICK_HEIGHT : STILE
  return { bottom, width: w - STILE * 2, height: h - STILE - bottom }
}

/**
 * A shoji panel's cedar frame and kumiko lattice as one geometry, standing on y = 0,
 * centered on x, in the z = 0 plane.
 */
export function buildShojiFrame(w: number, h: number, kickboard: boolean, seed: number): BufferGeometry {
  const off = uvOffsets(seed)
  const parts: BufferGeometry[] = []
  const box = (sx: number, sy: number, sz: number, cx: number, cy: number) =>
    parts.push(texturedBox([sx, sy, sz], [cx, cy, 0], { uvOffset: off() }))

  // Stiles (full height) and rails.
  box(STILE, h, DEPTH, -w / 2 + STILE / 2, h / 2)
  box(STILE, h, DEPTH, w / 2 - STILE / 2, h / 2)
  box(w - STILE * 2, STILE, DEPTH, 0, h - STILE / 2)
  box(w - STILE * 2, STILE, DEPTH, 0, STILE / 2)

  if (kickboard) {
    // Middle rail above a thin solid board.
    box(w - STILE * 2, STILE * 0.8, DEPTH, 0, KICK_HEIGHT - STILE * 0.4)
    box(w - STILE * 2, KICK_HEIGHT - STILE * 1.8, DEPTH * 0.4, 0, STILE + (KICK_HEIGHT - STILE * 1.8) / 2)
  }

  // Lattice: whole cells across the paper area.
  const paper = shojiPaperRect(w, h, kickboard)
  const cols = Math.max(2, Math.round(paper.width / CELL_W))
  const rows = Math.max(2, Math.round(paper.height / CELL_H))
  for (let c = 1; c < cols; c++) {
    box(BAR, paper.height, BAR_DEPTH, -paper.width / 2 + (paper.width * c) / cols, paper.bottom + paper.height / 2)
  }
  for (let r = 1; r < rows; r++) {
    box(paper.width, BAR, BAR_DEPTH, 0, paper.bottom + (paper.height * r) / rows)
  }

  return mergeAndDispose(parts)
}
