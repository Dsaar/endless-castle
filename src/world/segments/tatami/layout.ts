import { chance, pick, randInt, type Random } from '../../../lib/random'
import { CORD_BASE } from '../../../scene/kit/lanternGeometry'
import type { LanternPlacement } from '../../../scene/kit/LanternInstances'
import type { ShojiPlacement } from '../../../scene/kit/ShojiInstances'
import type { BoxSpec, InstanceTransform, Vec3 } from '../../../scene/kit/types'
import { HALF_BAY, phaseStream } from '../common'

// The vertical stack of every wall (meters from the floor up).
export const ROOM_HEIGHT = 2.6
export const ROOM_SILL = 0.04
export const DOOR_HEIGHT = 1.9
const KAMOI = 0.1
const HEAD = 0.1
export const TRANSOM_HEIGHT = ROOM_HEIGHT - HEAD - (ROOM_SILL + DOOR_HEIGHT + KAMOI)
export const ROOM_POST = 0.15
/** Sliding panels run in two tracks this far either side of the wall line. */
export const TRACK = 0.03
/** End walls stand this far inside the room, so the next segment's pieces never poke through them. */
export const END_WALL_INSET = 0.05
export const PIER_DEPTH = 14
export const PIER: Vec3 = [0.3, PIER_DEPTH, 0.3]
export const BATTEN_SIZE = 0.035
export const HANGING_CORD = 0.12
/** The scroll hangs from just under the door-head beam. */
const SCROLL_HOOK = ROOM_SILL + DOOR_HEIGHT - 0.02
/** Scroll positions along each plaster half, from its middle. */
const SCROLL_OFFSETS = [-0.6, 0, 0.6]

/** Each side wall is two halves between posts: shoji, or solid plaster (where the scroll can hang). */
export type WallHalf = 'shoji' | 'plaster'

export interface TatamiParams {
  /** Tatami cells across: the room is a square `cells × 0.91` m. */
  cells: 5 | 6
  size: number
  /** Side wall halves: left near, left far, right near, right far. */
  halves: WallHalf[]
  /** Scroll slot: `half × 3 + position` (see `scrollSlots`). */
  scroll: number
  /** Lantern slots: four corner floor lanterns, then one hanging in the middle. */
  lanterns: boolean[]
  /** False when the previous room's far wall doubles as this room's near wall. */
  entryWall: boolean
  /** Nearly identical rooms still to come in this run. */
  runLeft: number
  /** How many rooms into the run this is (0 for the first). */
  echo: number
  seed: number
}

export function roomSize(cells: number) {
  return cells * HALF_BAY
}

/** Every scroll slot on a plaster half, for these walls. */
export function scrollSlots(halves: readonly WallHalf[]) {
  return halves.flatMap((h, i) => (h === 'plaster' ? SCROLL_OFFSETS.map((_, k) => i * SCROLL_OFFSETS.length + k) : []))
}

/**
 * A fresh room: the first of a run of two to four, cut short to `roomsAfter` more rooms when a
 * Forking Hall is due sooner.
 */
export function generateTatami(rand: Random, roomsAfter = Number.POSITIVE_INFINITY): TatamiParams {
  const cells = pick<5 | 6>(rand, [5, 6, 6])
  const halves: WallHalf[] = ['shoji', 'shoji', 'shoji', 'shoji']
  // Two or three halves are plaster, so the scroll always has somewhere else to move to.
  const plaster = randInt(rand, 2, 3)
  while (halves.filter((h) => h === 'plaster').length < plaster) halves[randInt(rand, 0, 3)] = 'plaster'
  return {
    cells,
    size: roomSize(cells),
    halves,
    scroll: pick(rand, scrollSlots(halves)),
    lanterns: [true, true, true, true, chance(rand, 0.75)],
    entryWall: true,
    runLeft: Math.max(0, Math.min(randInt(rand, 1, 3), roomsAfter)),
    echo: 0,
    seed: randInt(rand, 1, 999_999),
  }
}

/** The next room of the run: the same room, except the scroll has moved and a lantern is gone. */
export function followTatami(previous: TatamiParams, rand: Random): TatamiParams {
  const otherSlots = scrollSlots(previous.halves).filter((s) => s !== previous.scroll)
  const lanterns = [...previous.lanterns]
  const present = lanterns.flatMap((on, i) => (on ? [i] : []))
  if (present.length > 2) lanterns[pick(rand, present)] = false
  return {
    ...previous,
    scroll: otherSlots.length ? pick(rand, otherSlots) : previous.scroll,
    lanterns,
    entryWall: false,
    runLeft: Math.max(0, previous.runLeft - 1),
    echo: previous.echo + 1,
  }
}

export interface TatamiLayout {
  /** Width of every sliding panel; transoms are two panels wide. */
  panelWidth: number
  transomWidth: number
  posts: InstanceTransform[]
  boxes: BoxSpec[]
  plaster: BoxSpec[]
  panels: ShojiPlacement[]
  transoms: ShojiPlacement[]
  battens: InstanceTransform[]
  piers: InstanceTransform[]
  standing: LanternPlacement[]
  hanging: LanternPlacement[]
  /** The scroll's hook and facing. */
  scroll: { position: Vec3; yaw: number }
  /** x of the four panel slots across an end wall. */
  slots: number[]
}

export function buildTatamiLayout(p: TatamiParams): TatamiLayout {
  const S = p.size
  const half = S / 2
  const phase = phaseStream(p.seed)
  const panelWidth = (S - ROOM_POST) / 4
  const transomWidth = (S - ROOM_POST) / 2
  const slots = [0, 1, 2, 3].map((k) => -(S - ROOM_POST) / 2 + panelWidth * (k + 0.5))
  const kamoiY = ROOM_SILL + DOOR_HEIGHT + KAMOI / 2
  const transomY = ROOM_SILL + DOOR_HEIGHT + KAMOI

  // Posts at the corners and halfway along each side. Without its own near wall, the near
  // corner posts belong to the previous room.
  const posts: InstanceTransform[] = []
  const cornerZ = ROOM_POST / 2
  for (const side of [-1, 1]) {
    if (p.entryWall) posts.push({ position: [side * half, 0, -cornerZ] })
    posts.push({ position: [side * half, 0, -half] }, { position: [side * half, 0, -S + cornerZ] })
  }

  const boxes: BoxSpec[] = [
    // Base under the mats (no overhang along the walk, so rooms in a run butt together cleanly).
    { size: [S + 0.3, 0.3, S], position: [0, -0.205, -half] },
    // Board ceiling and an outer fascia round its edge.
    { size: [S + 0.3, 0.05, S], position: [0, ROOM_HEIGHT + 0.025, -half] },
    { size: [0.06, 0.3, S], position: [-half - 0.12, ROOM_HEIGHT + 0.1, -half] },
    { size: [0.06, 0.3, S], position: [half + 0.12, ROOM_HEIGHT + 0.1, -half] },
  ]
  // Sill, door-head beam (kamoi) and head beam round every wall this room owns.
  const along = (x: number) => {
    boxes.push(
      { size: [0.1, ROOM_SILL, S], position: [x, ROOM_SILL / 2, -half] },
      { size: [0.1, KAMOI, S], position: [x, kamoiY, -half] },
      { size: [0.12, HEAD, S], position: [x, ROOM_HEIGHT - HEAD / 2, -half] },
    )
  }
  const across = (z: number) => {
    boxes.push(
      { size: [S, ROOM_SILL, 0.1], position: [0, ROOM_SILL / 2, z] },
      { size: [S, KAMOI, 0.1], position: [0, kamoiY, z] },
      { size: [S, HEAD, 0.12], position: [0, ROOM_HEIGHT - HEAD / 2, z] },
    )
  }
  along(-half)
  along(half)
  across(-S + END_WALL_INSET)
  if (p.entryWall) across(-END_WALL_INSET)

  // Side walls: two halves each, shoji panels or plaster.
  const plaster: BoxSpec[] = []
  const panels: ShojiPlacement[] = []
  const transoms: ShojiPlacement[] = []
  p.halves.forEach((kind, i) => {
    const side = i < 2 ? -1 : 1
    const zMid = -(i % 2 === 0 ? S / 4 : (S * 3) / 4)
    const x = side * half
    if (kind === 'plaster') {
      const h = ROOM_HEIGHT - HEAD - ROOM_SILL
      plaster.push({ size: [0.07, h, half - ROOM_POST], position: [x, ROOM_SILL + h / 2, zMid] })
      return
    }
    for (const k of [-0.5, 0.5]) {
      panels.push({ position: [x, ROOM_SILL, zMid + k * panelWidth], yaw: Math.PI / 2, lit: true })
    }
    transoms.push({ position: [x, transomY, zMid], yaw: Math.PI / 2, lit: true })
  })

  // End walls: the two outer panels are fixed (the middle two slide, see SlidingDoorPair);
  // a pair of lattice transoms runs across above them. Outer panels sit in the far track.
  const endWall = (z: number, roomSide: number) => {
    for (const k of [0, 3]) panels.push({ position: [slots[k], ROOM_SILL, z - roomSide * TRACK], lit: true })
    for (const x of [-transomWidth / 2, transomWidth / 2]) transoms.push({ position: [x, transomY, z], lit: true })
  }
  endWall(-S + END_WALL_INSET, 1)
  if (p.entryWall) endWall(-END_WALL_INSET, -1)

  // Ceiling battens (sao) across the room.
  const battens: InstanceTransform[] = []
  const rows = p.cells * 2
  for (let k = 1; k < rows; k++) battens.push({ position: [0, ROOM_HEIGHT - BATTEN_SIZE / 2, -(k * S) / rows] })

  const inset = 0.6
  const piers: InstanceTransform[] = []
  for (const sx of [-1, 1]) {
    for (const z of [-inset, -S + inset]) piers.push({ position: [sx * (half - inset), -0.355 - PIER_DEPTH, z] })
  }

  // Lantern slots 0–3: floor lanterns in the corners. Slot 4: hanging in the middle.
  const corners: Vec3[] = [
    [-(half - 0.45), 0, -0.45],
    [-(half - 0.45), 0, -(S - 0.45)],
    [half - 0.45, 0, -0.45],
    [half - 0.45, 0, -(S - 0.45)],
  ]
  const standing: LanternPlacement[] = []
  corners.forEach((position, i) => {
    const ph = phase()
    if (p.lanterns[i]) standing.push({ position, phase: ph })
  })
  const centerPhase = phase()
  const hanging: LanternPlacement[] = p.lanterns[4]
    ? [{ position: [0, ROOM_HEIGHT - (CORD_BASE + HANGING_CORD), -half], phase: centerPhase }]
    : []

  // The scroll hangs on a plaster half, facing into the room.
  const h = Math.floor(p.scroll / SCROLL_OFFSETS.length)
  const side = h < 2 ? -1 : 1
  const zMid = -(h % 2 === 0 ? S / 4 : (S * 3) / 4)
  const scroll = {
    position: [side * (half - 0.05), SCROLL_HOOK, zMid + SCROLL_OFFSETS[p.scroll % SCROLL_OFFSETS.length]] as Vec3,
    yaw: side < 0 ? Math.PI / 2 : -Math.PI / 2,
  }

  return { panelWidth, transomWidth, posts, boxes, plaster, panels, transoms, battens, piers, standing, hanging, scroll, slots }
}
