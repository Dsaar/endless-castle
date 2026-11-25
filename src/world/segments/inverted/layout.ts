import { chance, randInt, randRange, type Random } from '../../../lib/random'
import { CORD_BASE } from '../../../scene/kit/lanternGeometry'
import type { LanternPlacement } from '../../../scene/kit/LanternInstances'
import type { ShojiPlacement } from '../../../scene/kit/ShojiInstances'
import type { BoxSpec, InstanceTransform, Vec3 } from '../../../scene/kit/types'
import { BAY, phaseStream } from '../common'
import { litBays, WALL_KAMOI, WALL_PANEL, WALL_PANEL_SIZE, WALL_POST, WALL_SILL } from '../shojiWall'

/**
 * The Inverted Chamber: a long room built for walking on its ceiling. Its walls are the same
 * both ways up (a tier of shoji at the floor, another hung from the ceiling, a beam between),
 * the floor is a board ceiling with battens, and the ceiling is a tatami floor with the
 * furniture standing on it upside down. The walk runs along the floor; `InvertDirector` rolls
 * the camera over so you stand on the ceiling instead (see `INVERT_ENTER` / `INVERT_EXIT`).
 */

/** Across the room (meters): five tatami widths. */
export const CHAMBER_WIDTH = 4.55
const HALF = CHAMBER_WIDTH / 2
/** One tier of wall: sill, sliding panels, door head. */
const TIER = WALL_SILL + WALL_PANEL + WALL_KAMOI
/** The beam between the two tiers. */
const BAND = 0.12
/** Floor to ceiling: two tiers and the band, so the walls read the same either way up. */
export const CHAMBER_HEIGHT = TIER * 2 + BAND
/** The camera rolls about a line this high: halfway up, so upside down it stands on the ceiling. */
export const ROLL_PIVOT = CHAMBER_HEIGHT / 2
/** The roll starts this far in… */
export const INVERT_ENTER = 2.2
/** …and turns back this far before the end, so you are on your feet again at the door. */
export const INVERT_EXIT = 5.5
/** End walls stand this far inside the room, clear of the neighbours. */
const END_INSET = 0.06
export const POST: Vec3 = [WALL_POST, CHAMBER_HEIGHT, WALL_POST]
export const BATTEN: Vec3 = [CHAMBER_WIDTH, 0.035, 0.035]
export const PIER: Vec3 = [0.3, 14, 0.3]
export const LANTERN_CORD = 0.35
/** End-wall panel slots: four across, the middle two open as a doorway at the floor. */
const SLOT_WIDTH = (CHAMBER_WIDTH - WALL_POST) / 4
export const END_PANEL_SIZE: [number, number] = [SLOT_WIDTH, WALL_PANEL]
// Furniture (meters).
const TABLE_TOP: Vec3 = [0.95, 0.04, 0.7]
const TABLE_LEG: Vec3 = [0.06, 0.3, 0.06]
export const CUSHION: Vec3 = [0.56, 0.07, 0.6]
export const SCREEN_PANEL: [number, number] = [0.5, 1.45]

export interface InvertedParams {
  bays: number
  length: number
  /** Which bays glow: floor tier left / right, ceiling tier left / right. */
  lit: boolean[][]
  /** Which side each low table sits on (one per three bays), and which side the screen stands. */
  tableSides: (-1 | 1)[]
  screenSide: -1 | 1
  /** z of the folding screen, as a share of the length. */
  screenAt: number
  /** Which side wall the scroll hangs on, and where along it (share of the length). */
  scrollSide: -1 | 1
  scrollAt: number
  seed: number
}

export function generateInverted(rand: Random): InvertedParams {
  const bays = randInt(rand, 9, 12)
  const lit = [0, 1, 2, 3].map(() => litBays(rand, bays, chance(rand, 0.6) ? 'all' : 'sparse'))
  const tables = Math.max(2, Math.floor(bays / 3))
  return {
    bays,
    length: bays * BAY,
    lit,
    tableSides: Array.from({ length: tables }, () => (chance(rand, 0.5) ? -1 : 1)),
    screenSide: chance(rand, 0.5) ? -1 : 1,
    screenAt: randRange(rand, 0.35, 0.65),
    scrollSide: chance(rand, 0.5) ? -1 : 1,
    scrollAt: randRange(rand, 0.25, 0.75),
    seed: randInt(rand, 1, 999_999),
  }
}

export interface InvertedLayout {
  /** Slabs, sills, door heads, the band, end-wall beams, table tops and legs. */
  boxes: BoxSpec[]
  cushions: InstanceTransform[]
  posts: InstanceTransform[]
  battens: InstanceTransform[]
  piers: InstanceTransform[]
  panels: ShojiPlacement[]
  endPanels: ShojiPlacement[]
  screens: ShojiPlacement[]
  /** Hanging lanterns rising from the floor (they hang from it, seen upside down). */
  rising: LanternPlacement[]
  /** Floor lanterns standing upside down on the ceiling. */
  andon: LanternPlacement[]
  scroll: { position: Vec3; yaw: number }
}

export function buildInvertedLayout(p: InvertedParams): InvertedLayout {
  const L = p.length
  const H = CHAMBER_HEIGHT
  const phase = phaseStream(p.seed)
  const out: InvertedLayout = {
    boxes: [],
    cushions: [],
    posts: [],
    battens: [],
    piers: [],
    panels: [],
    endPanels: [],
    screens: [],
    rising: [],
    andon: [],
    scroll: { position: [0, 0, 0], yaw: 0 },
  }

  // Slabs under the floor and over the ceiling.
  out.boxes.push(
    { size: [CHAMBER_WIDTH + 0.3, 0.3, L], position: [0, -0.205, -L / 2] },
    { size: [CHAMBER_WIDTH + 0.3, 0.3, L], position: [0, H + 0.205, -L / 2] },
  )

  // Side walls: posts the full height at every bay line, two tiers of panels, a band between.
  // A tier's sill and door head mirror about the middle, so the walls read the same either way up.
  const [pw] = WALL_PANEL_SIZE
  for (const side of [-1, 1] as const) {
    const x = side * HALF
    for (let i = 0; i <= p.bays; i++) {
      const z = i === 0 ? -WALL_POST / 2 : i === p.bays ? -L + WALL_POST / 2 : -i * BAY
      out.posts.push({ position: [x, 0, z] })
    }
    for (const y of [WALL_SILL / 2, H - WALL_SILL / 2]) out.boxes.push({ size: [0.1, WALL_SILL, L], position: [x, y, -L / 2] })
    for (const y of [TIER - WALL_KAMOI / 2, H - TIER + WALL_KAMOI / 2]) {
      out.boxes.push({ size: [0.1, WALL_KAMOI, L], position: [x, y, -L / 2] })
    }
    out.boxes.push({ size: [0.16, BAND, L], position: [x, H / 2, -L / 2] })
    const lower = p.lit[side < 0 ? 0 : 1]
    const upper = p.lit[side < 0 ? 2 : 3]
    for (let i = 0; i < p.bays; i++) {
      for (let k = 0; k < 2; k++) {
        const z = -(i * BAY + WALL_POST / 2 + pw * (k + 0.5))
        out.panels.push({ position: [x, WALL_SILL, z], yaw: Math.PI / 2, lit: lower[i] })
        out.panels.push({ position: [x, H - WALL_SILL - WALL_PANEL, z], yaw: Math.PI / 2, lit: upper[i] })
      }
    }
  }

  // End walls: four slots across each tier. At the floor the middle two are the doorway; the
  // ceiling tier is closed, a lit doorway to nowhere over your head (under your feet, upside down).
  const slots = [0, 1, 2, 3].map((k) => -HALF + WALL_POST / 2 + SLOT_WIDTH * (k + 0.5))
  for (const z of [-END_INSET, -L + END_INSET]) {
    for (const y of [WALL_SILL / 2, H - WALL_SILL / 2]) out.boxes.push({ size: [CHAMBER_WIDTH, WALL_SILL, 0.1], position: [0, y, z] })
    for (const y of [TIER - WALL_KAMOI / 2, H - TIER + WALL_KAMOI / 2]) {
      out.boxes.push({ size: [CHAMBER_WIDTH, WALL_KAMOI, 0.1], position: [0, y, z] })
    }
    out.boxes.push({ size: [CHAMBER_WIDTH, BAND, 0.14], position: [0, H / 2, z] })
    for (const k of [0, 3]) out.endPanels.push({ position: [slots[k], WALL_SILL, z], lit: true })
    for (const k of [0, 1, 2, 3]) out.endPanels.push({ position: [slots[k], H - WALL_SILL - WALL_PANEL, z], lit: true })
  }

  // The floor reads as a board ceiling: battens across it, every half bay.
  for (let k = 1; k < p.bays * 2; k++) out.battens.push({ position: [0, BATTEN[1] / 2, -(k * BAY) / 2] })

  // Piers rise from the ceiling slab into the dark: the room hangs from nothing, upside down.
  for (const side of [-1, 1]) {
    for (const z of [-0.6, -L / 2, -L + 0.6]) out.piers.push({ position: [side * (HALF - 0.5), H + 0.355, z] })
  }

  // Lanterns "hanging" up from the floor, off the walk, every third bay, alternating sides.
  const cord = LANTERN_CORD
  for (let i = 1, side = 1; i < p.bays; i += 3, side = -side) {
    out.rising.push({ position: [side * 1.25, CORD_BASE + cord, -i * BAY - BAY / 2], pitch: Math.PI, phase: phase() })
  }

  // The furniture stands on the ceiling, upside down: low tables with cushions either side,
  // a floor lantern in each corner, a folding screen against one wall.
  const top = H
  p.tableSides.forEach((side, i) => {
    const z = -L * ((i + 0.5) / p.tableSides.length)
    const x = side * 1.35
    const [tw, , td] = TABLE_TOP
    out.boxes.push({ size: TABLE_TOP, position: [x, top - TABLE_LEG[1] - TABLE_TOP[1] / 2, z] })
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        out.boxes.push({
          size: TABLE_LEG,
          position: [x + sx * (tw / 2 - 0.08), top - TABLE_LEG[1] / 2, z + sz * (td / 2 - 0.08)],
        })
      }
    }
    for (const dz of [-1, 1]) out.cushions.push({ position: [x, top - CUSHION[1] / 2, z + dz * (td / 2 + 0.42)], yaw: dz * 0.08 })
  })
  for (const side of [-1, 1]) {
    for (const z of [-0.55, -L + 0.55]) {
      out.andon.push({ position: [side * (HALF - 0.5), top, z], pitch: Math.PI, phase: phase() })
    }
  }

  // A folding screen: four panels in a zigzag, hung from the ceiling against the wall.
  const [sw, sh] = SCREEN_PANEL
  const screenZ = -L * p.screenAt
  for (let k = 0; k < 4; k++) {
    const zig = k % 2 === 0 ? 0.12 : 0
    out.screens.push({
      position: [p.screenSide * (HALF - 0.32 - zig), top - sh, screenZ + (k - 1.5) * (sw * 0.95)],
      yaw: Math.PI / 2 + (k % 2 === 0 ? 0.35 : -0.35),
      lit: true,
    })
  }

  // The scroll hangs from a hook upside down: it hangs toward the ceiling, its floor.
  const hookY = H - (WALL_SILL + WALL_PANEL - 0.05)
  out.scroll = {
    position: [p.scrollSide * (HALF - 0.06), hookY, -L * p.scrollAt],
    yaw: p.scrollSide < 0 ? Math.PI / 2 : -Math.PI / 2,
  }
  return out
}
