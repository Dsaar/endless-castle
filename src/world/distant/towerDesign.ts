import { Matrix4, Vector3 } from 'three'
import { chance, createRandom, hashSeed, randInt, randRange, type Random } from '../../lib/random'
import type { FlaredRoofShape } from '../../scene/flaredRoof'
import { PAGODA_CLEARANCE, PAGODA_HEIGHT, PAGODAS } from '../backdropLayout'

/**
 * The distant castle's pieces: floating towers of stacked stories under curved roofs, and
 * wide one- or two-story rooms, with posts dangling underneath. One piece per occupied cell
 * of a 3D grid, designed from `hash(seed, cell)`, so the same cell always holds the same
 * piece. Everything a piece can reach (roof eaves, posts, tilt, drift, spin) fits inside its
 * cell, so pieces never touch each other.
 */

/** Cell size across (x and z) and up (y), in meters. */
export const CELL_SIZE = 48
export const CELL_HEIGHT = 64
/** Pieces keep this far inside their cell's walls. */
const CELL_MARGIN = 1.5
/** Share of cells that hold a piece. */
const OCCUPANCY = 0.42
/** Share of pieces that are rooms rather than towers. */
const ROOM_SHARE = 0.3
/** Share of rooms that move, and of towers (which only turn): about one piece in ten moves. */
const ROOM_MOVING = 0.28
const TOWER_MOVING = 0.03
/** Share hung upside down, and tilted (the rest stand upright). */
const FLIPPED = 0.17
const TILTED = 0.24

/** The unit roof's eave reaches this far out per meter of story width (half-width 1 ↔ 0.8 w). */
export const ROOF_REACH = 0.8
/**
 * The two roof shapes, in units of the eave half-width: every story's roof, and the pointed
 * cap on the top story. Scaled per instance by ROOF_REACH × the story's size. Coarse (about
 * 290 triangles), since they're never closer than 40 m, and with a dimmer soffit than the
 * pagodas': seen from below at 50 m, theirs would read as a lit orange slab.
 */
export const ROOF_SHAPE: FlaredRoofShape = {
  halfIn: 0.5,
  halfWall: 0.625,
  halfOut: 1,
  rise: 0.2,
  lift: 0.09,
  thick: 0.035,
  segments: 16,
  steps: 6,
  soffitGlow: 0.16,
}
export const CAP_SHAPE: FlaredRoofShape = {
  halfIn: 0.06,
  halfWall: 0.625,
  halfOut: 1,
  rise: 0.55,
  lift: 0.12,
  thick: 0.035,
  segments: 16,
  steps: 6,
  soffitGlow: 0.16,
}

const SLAB_THICKNESS = 0.7
const SLAB_REACH = 1.12
const FINIAL: [number, number] = [0.28, 2.6]
/** Windows stand this far proud of the wall, so they never z-fight it at 150 m. */
const WINDOW_PROUD = 0.08
/** Glow of an unlit window: almost black, but the grid still shows close up. */
const DARK_WINDOW = 0.03

export type TowerKind = 'tower' | 'room'

export interface TowerDesign {
  /** Seeds the per-window lit pattern. */
  seed: number
  kind: TowerKind
  stories: number
  /** Per story, bottom first: width (x), depth (z), height, and the height of its floor. */
  width: number[]
  depth: number[]
  height: number[]
  base: number[]
  /** Posts under the floor slab: x, z, length, thickness, four numbers per post. */
  posts: number[]
  finial: boolean
  /** Share of windows lit. */
  litShare: number
  /** The piece's frame to world space: tilt, flip and turn, then position. */
  pose: Matrix4
  /** World bounding box (center and half-size), including everything its motion sweeps. */
  center: Vector3
  half: Vector3
  /**
   * Motion, run in the vertex shader: turn rate about the vertical through `center` (rad/s),
   * then a sideways sway of `drift` meters along `heading` (radians in the xz plane), at `phase`.
   */
  spin: number
  drift: number
  heading: number
  phase: number
}

export interface TowerSink {
  /** A box, center and size in the piece's frame. `shade` darkens it (posts, slab). */
  box(x: number, y: number, z: number, sx: number, sy: number, sz: number, shade: number): void
  /** A roof with its eave tips at (x, y, z), scaled from the unit roof. */
  roof(x: number, y: number, z: number, sx: number, sy: number, sz: number, cap: boolean): void
  /** A window facing out along (sin yaw, 0, cos yaw). `glow` 0 to 1; `warm` blends lantern (0) to shoji (1). */
  window(x: number, y: number, z: number, yaw: number, w: number, h: number, glow: number, warm: number): void
}

const Y_AXIS = new Vector3(0, 1, 0)
const X_AXIS = new Vector3(1, 0, 0)
const scratchAxis = new Vector3()
const scratchR = new Matrix4()
const scratchC = new Vector3()

/** The piece in cell (cx, cy, cz), or null when the cell is empty or nothing fits. */
export function designTower(worldSeed: number, cx: number, cy: number, cz: number): TowerDesign | null {
  const seed = hashSeed(worldSeed, 0x70a3, cx, cy, cz)
  const rand = createRandom(seed)
  if (rand() >= OCCUPANCY) return null

  const kind: TowerKind = rand() < ROOM_SHARE ? 'room' : 'tower'
  const d = kind === 'room' ? roomStories(rand) : towerStories(rand)
  const top = d.base[d.stories - 1] + d.height[d.stories - 1]
  const topW = d.width[d.stories - 1]
  const topD = d.depth[d.stories - 1]
  const finial = kind === 'tower'
  const capTop = top + CAP_SHAPE.rise * ROOF_REACH * Math.min(topW, topD) + (finial ? FINIAL[1] : 0)

  // Posts dangling from under the slab, the odd one long (a keel).
  const posts: number[] = []
  const postCount = kind === 'room' ? randInt(rand, 3, 6) : randInt(rand, 2, 5)
  let deepest = 0
  for (let i = 0; i < postCount; i++) {
    const length = i === 0 && chance(rand, 0.5) ? randRange(rand, 10, 16) : randRange(rand, 3.5, 11)
    const x = i === 0 ? 0 : randRange(rand, -0.42, 0.42) * d.width[0]
    const z = i === 0 ? 0 : randRange(rand, -0.42, 0.42) * d.depth[0]
    posts.push(x, z, length, randRange(rand, 0.32, 0.5))
    deepest = Math.max(deepest, length)
  }
  const bottom = -SLAB_THICKNESS - deepest

  // Pose: turn, maybe flip, maybe tilt. Moving pieces stay level (or exactly upside down).
  const yaw = rand() * Math.PI * 2
  const roll = rand()
  const flipped = roll < FLIPPED
  const moving = chance(rand, kind === 'room' ? ROOM_MOVING : TOWER_MOVING)
  const spins = moving && (kind === 'tower' || chance(rand, 0.45))
  const tilt = moving || flipped ? 0 : roll < FLIPPED + TILTED ? randRange(rand, 0.1, 0.35) : randRange(rand, 0, 0.03)
  const tiltDir = rand() * Math.PI * 2

  const pose = new Matrix4().makeRotationAxis(Y_AXIS, yaw)
  if (flipped) pose.premultiply(scratchR.makeRotationAxis(X_AXIS, Math.PI))
  if (tilt > 0) pose.premultiply(scratchR.makeRotationAxis(scratchAxis.set(Math.cos(tiltDir), 0, Math.sin(tiltDir)), tilt))

  // World bounds of the local box [-hx, hx] × [bottom, capTop] × [-hz, hz].
  const hx = ROOF_REACH * d.width[0]
  const hz = ROOF_REACH * d.depth[0]
  const hy = (capTop - bottom) / 2
  const offset = scratchC.set(0, (capTop + bottom) / 2, 0).applyMatrix4(pose)
  const e = pose.elements
  const half = new Vector3(
    Math.abs(e[0]) * hx + Math.abs(e[4]) * hy + Math.abs(e[8]) * hz,
    Math.abs(e[1]) * hx + Math.abs(e[5]) * hy + Math.abs(e[9]) * hz,
    Math.abs(e[2]) * hx + Math.abs(e[6]) * hy + Math.abs(e[10]) * hz,
  )

  let spin = 0
  let drift = 0
  // Sideways: along the piece's own x axis, which the turn sends to (cos yaw, -sin yaw).
  const heading = -yaw
  if (spins) {
    spin = randRange(rand, 0.012, 0.03) * (chance(rand, 0.5) ? 1 : -1)
    const r = Math.hypot(half.x, half.z)
    half.x = r
    half.z = r
  } else if (moving) {
    drift = randRange(rand, 4, 8)
    half.x += drift * Math.abs(Math.cos(heading))
    half.z += drift * Math.abs(Math.sin(heading))
  }

  // Fit inside the cell, anywhere that leaves the margin.
  const free = (size: number, h: number) => size - 2 * CELL_MARGIN - 2 * h
  const fx = free(CELL_SIZE, half.x)
  const fy = free(CELL_HEIGHT, half.y)
  const fz = free(CELL_SIZE, half.z)
  if (fx < 0 || fy < 0 || fz < 0) return null
  const center = new Vector3(
    cx * CELL_SIZE + CELL_MARGIN + half.x + rand() * fx,
    cy * CELL_HEIGHT + CELL_MARGIN + half.y + rand() * fy,
    cz * CELL_SIZE + CELL_MARGIN + half.z + rand() * fz,
  )
  if (nearPagoda(center, half)) return null

  // Moving pieces are level, so `offset` has no x or z and they turn about their own axis.
  pose.setPosition(center.x - offset.x, center.y - offset.y, center.z - offset.z)

  return {
    seed,
    kind,
    ...d,
    posts,
    finial,
    litShare: randRange(rand, 0.45, 0.9),
    pose,
    center,
    half,
    spin,
    drift,
    heading,
    phase: rand() * Math.PI * 2,
  }
}

interface Stories {
  stories: number
  width: number[]
  depth: number[]
  height: number[]
  base: number[]
}

/** 3–6 square-ish stories, each a little narrower and lower than the one below. */
function towerStories(rand: Random): Stories {
  const stories = randInt(rand, 3, 6)
  const w0 = randRange(rand, 7, 12)
  const aspect = randRange(rand, 0.85, 1.15)
  const taper = randRange(rand, 0.06, 0.11)
  const h0 = randRange(rand, 4.4, 5.6)
  return stack(stories, (i) => w0 * (1 - taper) ** i, aspect, (i) => h0 * (1 - 0.05 * i))
}

/** 1–2 stories, wide and shallow. */
function roomStories(rand: Random): Stories {
  const stories = chance(rand, 0.3) ? 2 : 1
  const w0 = randRange(rand, 11, 16)
  const aspect = randRange(rand, 6.5, 9.5) / w0
  const h0 = randRange(rand, 4, 4.8)
  return stack(stories, (i) => w0 * (1 - 0.12 * i), aspect, (i) => h0 * (1 - 0.08 * i))
}

function stack(stories: number, widthAt: (i: number) => number, aspect: number, heightAt: (i: number) => number): Stories {
  const out: Stories = { stories, width: [], depth: [], height: [], base: [] }
  let y = 0
  for (let i = 0; i < stories; i++) {
    const w = widthAt(i)
    out.width.push(w)
    out.depth.push(w * aspect)
    out.height.push(heightAt(i))
    out.base.push(y)
    y += heightAt(i)
  }
  return out
}

function nearPagoda(center: Vector3, half: Vector3) {
  for (const { position: [px, py, pz] } of PAGODAS) {
    const reach = PAGODA_CLEARANCE + Math.max(half.x, half.z)
    const overlapsY = center.y - half.y < py + PAGODA_HEIGHT && center.y + half.y > py - 4
    if (overlapsY && Math.hypot(center.x - px, center.z - pz) < reach) return true
  }
  return false
}

/** Rise of story `i`'s roof (0 for the top story, which gets the cap). */
function roofRise(d: TowerDesign, i: number) {
  return ROOF_SHAPE.rise * ROOF_REACH * Math.min(d.width[i], d.depth[i])
}

/** Bodies, floor slab, posts, finial and roofs: everything but the windows. */
export function emitStructure(d: TowerDesign, sink: TowerSink) {
  const w0 = d.width[0]
  const d0 = d.depth[0]
  sink.box(0, -SLAB_THICKNESS / 2, 0, w0 * SLAB_REACH, SLAB_THICKNESS, d0 * SLAB_REACH, 0.75)
  const p = d.posts
  for (let i = 0; i < p.length; i += 4) {
    sink.box(p[i], -SLAB_THICKNESS - p[i + 2] / 2, p[i + 1], p[i + 3], p[i + 2], p[i + 3], 0.6)
  }

  const last = d.stories - 1
  for (let i = 0; i <= last; i++) {
    const w = d.width[i]
    const depth = d.depth[i]
    const h = d.height[i]
    const y = d.base[i]
    sink.box(0, y + h / 2, 0, w, h, depth, 1)
    sink.roof(0, y + h, 0, ROOF_REACH * w, ROOF_REACH * Math.min(w, depth), ROOF_REACH * depth, i === last)
  }

  if (d.finial) {
    const cap = d.base[last] + d.height[last] + CAP_SHAPE.rise * ROOF_REACH * Math.min(d.width[last], d.depth[last])
    sink.box(0, cap + FINIAL[1] / 2 - 0.6, 0, FINIAL[0], FINIAL[1], FINIAL[0], 0.5)
  }
}

/**
 * A row of tall windows on all four faces of every story, above the roof of the story
 * below. Each is lit or dark on its own, and now and then a whole story is dark.
 */
export function emitWindows(d: TowerDesign, sink: TowerSink) {
  const rand = createRandom(d.seed ^ 0x5bd1e995)
  for (let i = 0; i < d.stories; i++) {
    const h = d.height[i]
    const lower = i === 0 ? 0.4 : roofRise(d, i - 1) * 0.8 + 0.3
    const winH = Math.min(2.2, Math.max(1.2, (h - lower) * 0.45))
    const y = d.base[i] + lower + (h - lower) * 0.5
    const storyDark = chance(rand, 0.1)
    const warm = rand()

    for (let f = 0; f < 4; f++) {
      const yaw = (f * Math.PI) / 2
      // Faces 0 and 2 face ±z and run along x; faces 1 and 3 face ±x and run along z.
      const length = f % 2 === 0 ? d.width[i] : d.depth[i]
      const out = (f % 2 === 0 ? d.depth[i] : d.width[i]) / 2 + WINDOW_PROUD
      const cols = Math.min(4, Math.max(2, Math.round(length / 2.4)))
      const usable = length * 0.76
      const winW = (usable / cols) * 0.55
      const sin = Math.sin(yaw)
      const cos = Math.cos(yaw)
      for (let c = 0; c < cols; c++) {
        const u = -usable / 2 + (usable * (c + 0.5)) / cols
        const lit = !storyDark && rand() < d.litShare
        const glow = lit ? 0.55 + 0.45 * rand() : DARK_WINDOW
        sink.window(sin * out + cos * u, y, cos * out - sin * u, yaw, winW, winH, glow, warm * 0.6 + rand() * 0.4)
      }
    }
  }
}

/** Most windows a piece can have: 6 stories × 4 faces × 4 columns. */
export const MAX_WINDOWS = 96
/** Most boxes: slab, 6 posts, 6 stories, finial. */
export const MAX_BOXES = 14
/** Most roofs below the cap: 5. */
export const MAX_ROOFS = 5
