import { createRandom } from '../../lib/random'

/** One mat in grid units. A full mat is 2 × 1 (or 1 × 2); a half mat is 1 × 1. */
export interface TatamiMat {
  col: number
  row: number
  /** Cells along X. */
  w: 1 | 2
  /** Cells along Z. */
  h: 1 | 2
}

/** The classic 4.5-mat room: four mats pinwheeling around a half mat. */
const FOUR_AND_A_HALF: TatamiMat[] = [
  { col: 0, row: 0, w: 2, h: 1 },
  { col: 2, row: 0, w: 1, h: 2 },
  { col: 1, row: 2, w: 2, h: 1 },
  { col: 0, row: 1, w: 1, h: 2 },
  { col: 1, row: 1, w: 1, h: 1 },
]

/**
 * Lays tatami on a `cols` × `rows` grid of half-mat cells in the auspicious (shūgi) way:
 * no point where four mats meet, only T-junctions. Odd areas get one half mat.
 * Uses a small seeded backtracking search; falls back to a running bond if it runs long.
 */
export function layoutTatami(cols: number, rows: number, seed = 1): TatamiMat[] {
  if (cols === 3 && rows === 3) return FOUR_AND_A_HALF
  return search(cols, rows, seed) ?? runningBond(cols, rows)
}

function search(cols: number, rows: number, seed: number): TatamiMat[] | null {
  const rand = createRandom(seed)
  const grid = new Int32Array(cols * rows).fill(-1)
  const mats: TatamiMat[] = []
  let halvesLeft = (cols * rows) % 2
  let budget = 50_000

  const at = (c: number, r: number) => grid[r * cols + c]

  // A grid vertex is bad when all four cells around it are filled by four different mats.
  const vertexOk = (vc: number, vr: number) => {
    if (vc <= 0 || vr <= 0 || vc >= cols || vr >= rows) return true
    const a = at(vc - 1, vr - 1)
    const b = at(vc, vr - 1)
    const c = at(vc - 1, vr)
    const d = at(vc, vr)
    if (a < 0 || b < 0 || c < 0 || d < 0) return true
    return !(a !== b && a !== c && a !== d && b !== c && b !== d && c !== d)
  }

  const fill = (m: TatamiMat, id: number) => {
    for (let r = m.row; r < m.row + m.h; r++) for (let c = m.col; c < m.col + m.w; c++) grid[r * cols + c] = id
  }

  const fits = (m: TatamiMat) => {
    if (m.col + m.w > cols || m.row + m.h > rows) return false
    for (let r = m.row; r < m.row + m.h; r++) for (let c = m.col; c < m.col + m.w; c++) if (at(c, r) >= 0) return false
    return true
  }

  const cornersOk = (m: TatamiMat) => {
    for (let r = m.row; r <= m.row + m.h; r++) for (let c = m.col; c <= m.col + m.w; c++) if (!vertexOk(c, r)) return false
    return true
  }

  const solve = (from: number): boolean => {
    if (--budget < 0) return false
    let i = from
    while (i < grid.length && grid[i] >= 0) i++
    if (i === grid.length) return true
    const col = i % cols
    const row = Math.floor(i / cols)

    const options: TatamiMat[] =
      rand() < 0.5
        ? [{ col, row, w: 2, h: 1 }, { col, row, w: 1, h: 2 }]
        : [{ col, row, w: 1, h: 2 }, { col, row, w: 2, h: 1 }]
    if (halvesLeft > 0) options.push({ col, row, w: 1, h: 1 })

    for (const m of options) {
      if (!fits(m)) continue
      const id = mats.length
      fill(m, id)
      if (cornersOk(m)) {
        mats.push(m)
        const half = m.w === 1 && m.h === 1
        if (half) halvesLeft--
        if (solve(i + 1)) return true
        if (half) halvesLeft++
        mats.pop()
      }
      fill(m, -1)
    }
    return false
  }

  return solve(0) ? mats : null
}

/** Rows of mats along X, every other row shifted by a half mat. Always valid. */
function runningBond(cols: number, rows: number): TatamiMat[] {
  const mats: TatamiMat[] = []
  for (let row = 0; row < rows; row++) {
    let col = 0
    if (row % 2 === 1) mats.push({ col: col++, row, w: 1, h: 1 })
    while (col < cols) {
      const w = col + 2 <= cols ? 2 : 1
      mats.push({ col, row, w, h: 1 })
      col += w
    }
  }
  return mats
}
