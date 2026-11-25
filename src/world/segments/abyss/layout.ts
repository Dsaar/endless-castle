import { CatmullRomCurve3, Vector3 } from 'three'
import { chance, createRandom, randInt, randRange, type Random } from '../../../lib/random'
import { CORD_BASE } from '../../../scene/kit/lanternGeometry'
import type { LanternPlacement } from '../../../scene/kit/LanternInstances'
import type { InstanceTransform, Vec3 } from '../../../scene/kit/types'
import { ROOF_SHAPE } from '../../distant/towerDesign'
import type { SegmentPlan } from '../../segment'
import { phaseStream } from '../common'

/**
 * The Central Abyss: a huge round void, ringed by towers that rise and sink out of sight,
 * crossed by one long, thin plank bridge that sags a little in the middle. Everything is in the
 * segment's frame: the bridge runs from the origin down -Z, and the void's center is halfway
 * along it at the bridge's height.
 */

const DEG = Math.PI / 180

// --- The bridge -----------------------------------------------------------------------------

/** Straight, level run-in and run-out, so the walk joins its neighbours with matching tangents. */
const LEAD = 1.5
export const BRIDGE_WIDTH = 1.1
export const PLANK: Vec3 = [BRIDGE_WIDTH, 0.05, 0.2]
const PLANK_PITCH = 0.24
export const STRINGER: Vec3 = [0.08, 0.16, 1.02]
const STRINGER_PITCH = 0.95
const STRINGER_X = 0.46
export const RAIL_POST: Vec3 = [0.05, 0.9, 0.05]
const RAIL_POST_X = 0.53
const RAIL_BAY = 2
export const RAIL: Vec3 = [0.025, 0.025, RAIL_BAY]
export const LANTERN_POST: Vec3 = [0.1, 2.5, 0.1]
const LANTERN_POST_X = 0.64
export const ARM: Vec3 = [0.5, 0.06, 0.06]
export const LANTERN_SIZE = 1
export const LANTERN_CORD = 0.3
const LANTERN_X = 0.44
/** Pieces that stand up keep this far inside the segment's ends. */
const END_INSET = 0.06

// --- The ring of towers ---------------------------------------------------------------------

/** No tower stands within this angle of the way in or the way out (they would crowd the rooms either side). */
const GAP = 40 * DEG
/** Towers stand this much further out than the ring, at most. */
const RING_JITTER = 8
const TOWER_WIDTH: readonly [number, number] = [6, 9.5]
const STORY_HEIGHT: readonly [number, number] = [4.4, 5.6]
/** A story's roof eaves reach out this far past its walls (as a share of the half-width). */
const ROOF_REACH = ROOF_SHAPE.halfOut / ROOF_SHAPE.halfWall
const WINDOWS_PER_FACE = 3
/** Hanging lanterns at the roof corners, every this many stories. */
const LANTERN_EVERY = 3
export const TOWER_LANTERN_SIZE = 3

// --- The lights -----------------------------------------------------------------------------

const FAR_LIGHTS = 1500
const FAR_SPREAD = 150
const FAR_HEIGHT = 220
const EMBERS = 700
export const EMBER_LOW = -60
export const EMBER_SPAN = 100

export interface AbyssParams {
  /** Length of the bridge (meters). */
  length: number
  /** How far its middle sags below the ends. */
  sag: number
  towers: number
  /** Distance between the bridge's lantern posts (they alternate sides). */
  spacing: number
  seed: number
}

export function generateAbyss(rand: Random): AbyssParams {
  return {
    length: randRange(rand, 64, 84),
    sag: randRange(rand, 0.8, 1.8),
    towers: randInt(rand, 12, 16),
    spacing: randRange(rand, 8, 11),
    seed: randInt(rand, 1, 999_999),
  }
}

/** The ring the towers stand on: just past the bridge's ends, so it crosses the whole void. */
export function ringRadius(p: Pick<AbyssParams, 'length'>) {
  return p.length / 2 + 2
}

/** How far from the void's center anything of the ring reaches (towers, their eaves, their corners). */
export function abyssReach(p: Pick<AbyssParams, 'length'>) {
  return ringRadius(p) + RING_JITTER + (TOWER_WIDTH[1] / 2) * ROOF_REACH * Math.SQRT2 + 2
}

/** The void's center in the segment's frame. */
export function abyssCenter(p: Pick<AbyssParams, 'length'>): Vec3 {
  return [0, 0, -p.length / 2]
}

/** The bridge's height `s` meters along it: level at the ends, sagging smoothly in between. */
function sagAt(p: Pick<AbyssParams, 'length' | 'sag'>, s: number) {
  const u = Math.min(1, Math.max(0, (s - LEAD) / (p.length - LEAD * 2)))
  return -p.sag * Math.sin(Math.PI * u) ** 2
}

/** The walk: straight down -Z, sagging in the middle, with level leads at both ends. */
export function abyssPlan(p: Pick<AbyssParams, 'length' | 'sag'>): SegmentPlan {
  const span = p.length - LEAD * 2
  const n = Math.max(4, Math.round(span / 3))
  const points: Vec3[] = [[0, 0, 0], [0, 0, -LEAD]]
  for (let i = 1; i < n; i++) {
    const s = LEAD + (i * span) / n
    points.push([0, sagAt(p, s), -s])
  }
  points.push([0, 0, -(p.length - LEAD)], [0, 0, -p.length])
  return { points, end: { x: 0, y: 0, z: -p.length, yaw: 0 } }
}

/** The walk as a local curve (the plan's points), for laying the bridge along it. */
function abyssCurve(p: Pick<AbyssParams, 'length' | 'sag'>) {
  return new CatmullRomCurve3(
    abyssPlan(p).points.map(([x, y, z]) => new Vector3(x, y, z)),
    false,
    'centripetal',
  )
}

export interface BridgeLayout {
  planks: InstanceTransform[]
  stringers: InstanceTransform[]
  railPosts: InstanceTransform[]
  rails: InstanceTransform[]
  lanternPosts: InstanceTransform[]
  arms: InstanceTransform[]
  lanterns: LanternPlacement[]
}

export function buildBridgeLayout(p: AbyssParams): BridgeLayout {
  const curve = abyssCurve(p)
  const length = curve.getLength()
  const phase = phaseStream(p.seed)
  const at = (d: number) => {
    const u = Math.min(1, Math.max(0, d / length))
    const point = curve.getPointAt(u)
    const t = curve.getTangentAt(u)
    return { point, pitch: Math.atan2(t.y, Math.hypot(t.x, t.z)) }
  }
  const out: BridgeLayout = { planks: [], stringers: [], railPosts: [], rails: [], lanternPosts: [], arms: [], lanterns: [] }

  for (let d = PLANK_PITCH / 2; d < length; d += PLANK_PITCH) {
    const f = at(d)
    out.planks.push({ position: [0, f.point.y - PLANK[1] / 2, f.point.z], pitch: f.pitch })
  }
  for (let d = STRINGER_PITCH / 2; d < length; d += STRINGER_PITCH) {
    const f = at(d)
    for (const side of [-1, 1]) out.stringers.push({ position: [side * STRINGER_X, f.point.y - 0.13, f.point.z], pitch: f.pitch })
  }

  // A thin rope rail each side, on slim posts.
  const bays = Math.max(1, Math.round(length / RAIL_BAY))
  for (const side of [-1, 1]) {
    let prev: Vec3 | null = null
    for (let k = 0; k <= bays; k++) {
      const f = at(END_INSET + (k * (length - END_INSET * 2)) / bays)
      out.railPosts.push({ position: [side * RAIL_POST_X, f.point.y + RAIL_POST[1] / 2, f.point.z] })
      const top: Vec3 = [side * RAIL_POST_X, f.point.y + RAIL_POST[1] - 0.02, f.point.z]
      if (prev) out.rails.push(span(prev, top))
      prev = top
    }
  }

  // Lantern posts outside the rail, alternating sides, each with an arm over the walk.
  let side = chance(createRandom(p.seed), 0.5) ? -1 : 1
  for (let d = p.spacing / 2; d < length - 1; d += p.spacing) {
    const f = at(d)
    const y = f.point.y
    out.lanternPosts.push({ position: [side * LANTERN_POST_X, y, f.point.z] })
    out.arms.push({ position: [side * (LANTERN_POST_X - ARM[0] / 2 + 0.05), y + LANTERN_POST[1] - 0.06, f.point.z] })
    const armBottom = LANTERN_POST[1] - 0.06 - ARM[1] / 2
    out.lanterns.push({
      position: [side * LANTERN_X, y + armBottom - (CORD_BASE + LANTERN_CORD) * LANTERN_SIZE, f.point.z],
      phase: phase(),
    })
    side = -side
  }
  return out
}

/** A rail from `a` to `b`: the RAIL box at their midpoint, tilted and stretched to fit. */
function span(a: Vec3, b: Vec3): InstanceTransform {
  const dy = b[1] - a[1]
  const dz = b[2] - a[2]
  return {
    position: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2],
    pitch: Math.atan2(dy, -dz),
    scale: [1, 1, (Math.hypot(dz, dy) + 0.02) / RAIL_BAY],
  }
}

// --- Towers ---------------------------------------------------------------------------------

/** One instance of the towers' unlit parts: where it goes, and how bright (windows only). */
export interface TowerPiece extends InstanceTransform {
  shade?: number
}

export interface TowerLayout {
  /** Stories and the balcony slab at each tower's waist (shaded unit boxes, scaled). */
  boxes: TowerPiece[]
  /** One flared roof per story (the distant castle's unit roof, scaled); upside down below the waist. */
  roofs: TowerPiece[]
  /** Unit window quads, scaled; `shade` is how brightly each is lit. */
  windows: TowerPiece[]
  /** Unit lantern bodies. */
  lanterns: TowerPiece[]
}

/**
 * Towers all round the void except near the ways in and out: stacks of stories rising far
 * above the bridge and sinking far below it, the lower half upside down (roof under each story),
 * meeting at a balcony near the bridge's height. Lit windows on every face, lanterns hanging at
 * the roof corners.
 */
export function buildTowerLayout(p: AbyssParams): TowerLayout {
  const rand = createRandom(p.seed ^ 0x2545f491)
  const R = ringRadius(p)
  const [cx, , cz] = abyssCenter(p)
  const out: TowerLayout = { boxes: [], roofs: [], windows: [], lanterns: [] }

  // Two arcs, one either side of the bridge (angle 0 is +X, -90° the way in, 90° the way out).
  const arc = Math.PI - GAP * 2
  const perSide = [Math.ceil(p.towers / 2), Math.floor(p.towers / 2)]
  perSide.forEach((count, sideIndex) => {
    const from = sideIndex === 0 ? -Math.PI / 2 + GAP : Math.PI / 2 + GAP
    for (let k = 0; k < count; k++) {
      const angle = from + (arc * (k + 0.5 + randRange(rand, -0.3, 0.3))) / count
      const r = R + randRange(rand, 0, RING_JITTER)
      addTower(out, rand, [cx + Math.cos(angle) * r, 0, cz - Math.sin(angle) * r])
    }
  })
  return out
}

function addTower(out: TowerLayout, rand: Random, base: Vec3) {
  const w = randRange(rand, TOWER_WIDTH[0], TOWER_WIDTH[1])
  const h = randRange(rand, STORY_HEIGHT[0], STORY_HEIGHT[1])
  const yaw = randRange(rand, -0.5, 0.5)
  const waist = randRange(rand, -14, 6)
  const up = randInt(rand, 14, 24)
  const down = randInt(rand, 18, 30)
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  /** Tower-local (x, z) about its axis, turned by its yaw, to the segment's frame. */
  const at = (x: number, y: number, z: number): Vec3 => [base[0] + x * c + z * s, y, base[2] - x * s + z * c]
  const roofScale = w / 2 / ROOF_SHAPE.halfWall

  out.boxes.push({ position: at(0, waist, 0), yaw, scale: [w + 3, 0.5, w + 3] })

  const story = (bottom: number, flipped: boolean, k: number) => {
    // Every few stories a little narrower, so the silhouette isn't one long box.
    const sw = k % 5 === 4 ? w * 0.86 : w
    out.boxes.push({ position: at(0, bottom + h / 2, 0), yaw, scale: [sw, h - 0.15, sw] })
    const eave = flipped ? bottom : bottom + h
    out.roofs.push({ position: at(0, eave, 0), yaw, pitch: flipped ? Math.PI : 0, scale: [roofScale, roofScale, roofScale] })

    const dark = chance(rand, 0.14)
    const winW = Math.min(1.1, (sw / WINDOWS_PER_FACE) * 0.5)
    const winH = h * 0.42
    for (let f = 0; f < 4; f++) {
      const ry = (f * Math.PI) / 2
      const d = sw / 2 + 0.04
      for (let j = 0; j < WINDOWS_PER_FACE; j++) {
        const u = (j - (WINDOWS_PER_FACE - 1) / 2) * (sw / WINDOWS_PER_FACE) * 0.9
        const lit = !dark && !chance(rand, 0.3)
        out.windows.push({
          position: at(Math.sin(ry) * d + Math.cos(ry) * u, bottom + h * 0.5, Math.cos(ry) * d - Math.sin(ry) * u),
          yaw: yaw + ry,
          scale: [winW, winH, 1],
          shade: lit ? randRange(rand, 0.55, 1) : 0.05,
        })
      }
    }

    if (k % LANTERN_EVERY === 1) {
      const reach = (sw / 2) * ROOF_REACH * 0.92
      const y = flipped ? bottom + h * 0.25 : eave - 1.1
      for (const [x, z] of [[-reach, -reach], [reach, -reach], [-reach, reach], [reach, reach]]) {
        out.lanterns.push({ position: at(x, y, z), yaw, scale: [TOWER_LANTERN_SIZE, TOWER_LANTERN_SIZE, TOWER_LANTERN_SIZE] })
      }
    }
  }

  for (let k = 0; k < up; k++) story(waist + 0.25 + k * h, false, k)
  for (let k = 0; k < down; k++) story(waist - 0.25 - (k + 1) * h, true, k)
}

// --- Distant lights and embers ---------------------------------------------------------------

export interface GlowCloud {
  /** Base positions in the segment's frame. */
  positions: Float32Array
  /** Three random numbers per point (speed, brightness, size / phase). */
  seeds: Float32Array
}

/**
 * Lights far out in the dark beyond the towers: half of them scattered, half strung up and
 * down in columns, like the windows of towers too far away to see.
 */
export function buildFarLights(p: AbyssParams): GlowCloud {
  const rand = createRandom(p.seed ^ 0x1b873593)
  const inner = abyssReach(p)
  const [cx, , cz] = abyssCenter(p)
  const positions = new Float32Array(FAR_LIGHTS * 3)
  const seeds = new Float32Array(FAR_LIGHTS * 3)
  let column = { angle: 0, r: 0, left: 0 }
  for (let i = 0; i < FAR_LIGHTS; i++) {
    let angle: number
    let r: number
    if (i % 2 === 0) {
      if (column.left <= 0) column = { angle: rand() * Math.PI * 2, r: inner + rand() * FAR_SPREAD, left: randInt(rand, 12, 30) }
      column.left--
      angle = column.angle + randRange(rand, -0.01, 0.01)
      r = column.r
    } else {
      angle = rand() * Math.PI * 2
      r = inner + Math.sqrt(rand()) * FAR_SPREAD
    }
    positions[i * 3] = cx + Math.cos(angle) * r
    positions[i * 3 + 1] = randRange(rand, -FAR_HEIGHT, FAR_HEIGHT) * (0.35 + 0.65 * rand())
    positions[i * 3 + 2] = cz - Math.sin(angle) * r
    seeds[i * 3] = rand()
    seeds[i * 3 + 1] = rand()
    seeds[i * 3 + 2] = rand()
  }
  return { positions, seeds }
}

/** Embers inside the void, rising slowly from far below the bridge to far above it (they wrap). */
export function buildEmbers(p: AbyssParams): GlowCloud {
  const rand = createRandom(p.seed ^ 0x85ebca6b)
  const R = ringRadius(p) - 4
  const [cx, , cz] = abyssCenter(p)
  const positions = new Float32Array(EMBERS * 3)
  const seeds = new Float32Array(EMBERS * 3)
  for (let i = 0; i < EMBERS; i++) {
    const angle = rand() * Math.PI * 2
    const r = Math.sqrt(rand()) * R
    positions[i * 3] = cx + Math.cos(angle) * r
    positions[i * 3 + 1] = EMBER_LOW + rand() * EMBER_SPAN
    positions[i * 3 + 2] = cz - Math.sin(angle) * r
    seeds[i * 3] = rand()
    seeds[i * 3 + 1] = rand()
    seeds[i * 3 + 2] = rand()
  }
  return { positions, seeds }
}
