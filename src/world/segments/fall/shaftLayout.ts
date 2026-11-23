import { clamp } from '../../../lib/math'
import { chance, createRandom, randInt, randRange, type Random } from '../../../lib/random'
import { CORD_BASE } from '../../../scene/kit/lanternGeometry'
import type { LanternPlacement } from '../../../scene/kit/LanternInstances'
import type { ShojiPlacement } from '../../../scene/kit/ShojiInstances'
import type { InstanceTransform, Vec3 } from '../../../scene/kit/types'
import { phaseStream } from '../common'
import { FALL_DROP, FALL_FORWARD } from './layout'

/**
 * Everything the player falls past, generated only for the Fall: hanging pillars, upside-down
 * rooms, floating stairs and lit towers, in the segment's frame (the deck is at y = 0, the
 * walkway lands at y = -FALL_DROP). All of it is instanced: one draw call per kind of piece.
 */

// --- The shaft ---------------------------------------------------------------------------

/** Nothing comes closer than this to the line the camera falls along (meters). */
const CLEAR_RADIUS = 5
/** The shaft is filled between these heights. */
const SHAFT_TOP = -16
const SHAFT_BOTTOM = -FALL_DROP + 16
/** Above this, pieces stay in front of the deck: the Threshold's and the Gate's piers hang behind it. */
const PIER_LEVEL = -26
/**
 * Below this, pieces keep out of the corridor above the walkway, where its suspension cords
 * rise 40 m: either behind the landing or well off to the side (the walkway turns at most
 * about this far sideways). Its pavilions float lower than SHAFT_BOTTOM.
 */
const WALKWAY_LEVEL = -FALL_DROP + 45
const WALKWAY_REACH = 14
/** The camera falls (and drifts forward) between these z. */
const LINE_START_Z = -0.5
const LINE_END_Z = -FALL_FORWARD
const ATTEMPTS = 80

// --- Hanging pillars with cross-shaped bases ---------------------------------------------

const PILLARS = 18
export const PILLAR_SHAFT: Vec3 = [0.5, 34, 0.5]
export const PILLAR_ARM: Vec3 = [3.4, 0.4, 0.4]
export const PILLAR_CAP: Vec3 = [0.9, 0.7, 0.9]
export const PILLAR_FOOT: Vec3 = [0.24, 0.5, 0.24]
export const PILLAR_LANTERN_SIZE = 1
export const PILLAR_LANTERN_CORD = 0.5
/** No pillar reaches higher than this: they hang out of the dark, not up past the deck. */
const PILLAR_TOP = -12

// --- Upside-down rooms --------------------------------------------------------------------

const ROOMS = 6
const ROOM_SIZE = 4.55
const ROOM_HEIGHT = 2.7
export const ROOM_SLAB: Vec3 = [ROOM_SIZE + 0.4, 0.24, ROOM_SIZE + 0.4]
export const ROOM_POST: Vec3 = [0.16, ROOM_HEIGHT, 0.16]
export const ROOM_BEAM: Vec3 = [ROOM_SIZE + 0.16, 0.18, 0.16]
/** Two panels per bay, two bays per wall, between the sill and the head beam. */
export const ROOM_PANEL: [number, number] = [(ROOM_SIZE / 2 - ROOM_POST[0]) / 2, ROOM_HEIGHT - ROOM_BEAM[1] * 2]
/** The roof shape every room and tower shares: [width, rise, length]. Towers scale it up. */
export const SHAFT_ROOF: Vec3 = [ROOM_SIZE + 1.6, 1.6, ROOM_SIZE + 1.4]

// --- Floating stairs ----------------------------------------------------------------------

const FLIGHTS = 10
const RISE = 0.2
const RUN = 0.3
export const STEP: Vec3 = [1.2, 0.16, 0.34]
export const STAIR_LANDING: Vec3 = [1.2, 0.16, 1.2]
export const STAIR_STRINGER: Vec3 = [0.07, 0.26, 3.2]
export const STAIR_LANTERN_SIZE = 0.7

// --- Lit towers ---------------------------------------------------------------------------

const TOWERS = 7
const STORY_HEIGHT = 3.2
export const TOWER_BODY: Vec3 = [5.2, STORY_HEIGHT - 0.22, 5.2]
export const TOWER_EAVE: Vec3 = [6.8, 0.22, 6.8]
export const TOWER_PANEL: [number, number] = [1.1, 1.6]
const TOWER_ROOF_SCALE = 1.2

export interface ShaftLayout {
  pillars: {
    shafts: InstanceTransform[]
    arms: InstanceTransform[]
    caps: InstanceTransform[]
    feet: InstanceTransform[]
    lanterns: LanternPlacement[]
  }
  rooms: {
    slabs: InstanceTransform[]
    posts: InstanceTransform[]
    beams: InstanceTransform[]
    panels: ShojiPlacement[]
    roofs: InstanceTransform[]
  }
  stairs: {
    steps: InstanceTransform[]
    landings: InstanceTransform[]
    stringers: InstanceTransform[]
    lanterns: LanternPlacement[]
  }
  towers: {
    bodies: InstanceTransform[]
    eaves: InstanceTransform[]
    panels: ShojiPlacement[]
    roofs: InstanceTransform[]
  }
}

export function buildShaftLayout(seed: number): ShaftLayout {
  const rand = createRandom(seed ^ 0x3c6ef372)
  const phase = phaseStream(seed)
  const place = createPlacer(rand)
  const out: ShaftLayout = {
    pillars: { shafts: [], arms: [], caps: [], feet: [], lanterns: [] },
    rooms: { slabs: [], posts: [], beams: [], panels: [], roofs: [] },
    stairs: { steps: [], landings: [], stringers: [], lanterns: [] },
    towers: { bodies: [], eaves: [], panels: [], roofs: [] },
  }
  // Biggest first, so the small pieces fill the gaps between them.
  for (let i = 0; i < TOWERS; i++) addTower(out.towers, rand, place, stratified(rand, i, TOWERS, -38, -92))
  for (let i = 0; i < ROOMS; i++) addRoom(out.rooms, rand, place, stratified(rand, i, ROOMS, -30, -98))
  for (let i = 0; i < PILLARS; i++) {
    addPillar(out.pillars, rand, place, phase, stratified(rand, i, PILLARS, SHAFT_TOP - 8, SHAFT_BOTTOM))
  }
  for (let i = 0; i < FLIGHTS; i++) addFlight(out.stairs, rand, place, phase, stratified(rand, i, FLIGHTS, -20, SHAFT_BOTTOM))
  return out
}

/** The i-th of n heights spread evenly from `top` down to `bottom`, jittered within its band. */
function stratified(rand: Random, i: number, n: number, top: number, bottom: number) {
  return top + ((bottom - top) * (i + rand())) / n
}

// --- Placing without collisions -----------------------------------------------------------

interface Footprint {
  x: number
  z: number
  /** Horizontal reach from the center. */
  radius: number
  bottom: number
  top: number
}

interface PlaceRequest {
  /** Height of the piece's reference point. */
  y: number
  /** How much further than CLEAR_RADIUS from the fall line the piece's edge sits (meters). */
  minGap: number
  maxGap: number
  radius: number
  /** How far the piece reaches below and above `y`. */
  below: number
  above: number
}

type Placer = (request: PlaceRequest) => Vec3 | null

/** Picks free spots around the fall line: clear of it, of the piers, of the walkway, and of each other. */
function createPlacer(rand: Random): Placer {
  const placed: Footprint[] = []
  return (request) => {
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      const angle = rand() * Math.PI * 2
      const r = CLEAR_RADIUS + randRange(rand, request.minGap, request.maxGap) + request.radius
      const f: Footprint = {
        x: Math.cos(angle) * r,
        z: (LINE_START_Z + LINE_END_Z) / 2 + Math.sin(angle) * r,
        radius: request.radius,
        bottom: request.y - request.below,
        top: request.y + request.above,
      }
      if (!fits(f) || placed.some((other) => overlaps(other, f))) continue
      placed.push(f)
      return [f.x, request.y, f.z]
    }
    return null
  }
}

function fits(f: Footprint) {
  const lineZ = clamp(f.z, LINE_END_Z, LINE_START_Z)
  if (Math.hypot(f.x, f.z - lineZ) - f.radius < CLEAR_RADIUS) return false
  if (f.top > PIER_LEVEL && f.z + f.radius > LINE_START_Z) return false
  if (f.bottom < WALKWAY_LEVEL && f.z - f.radius < LINE_END_Z + 2 && Math.abs(f.x) - f.radius < WALKWAY_REACH) return false
  return true
}

function overlaps(a: Footprint, b: Footprint) {
  return a.bottom < b.top + 1 && b.bottom < a.top + 1 && Math.hypot(a.x - b.x, a.z - b.z) < a.radius + b.radius + 0.6
}

/** Local → segment frame for a piece turned `yaw` about its center, and upside down if `flipped`. */
function frame(center: Vec3, yaw: number, flipped: boolean) {
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  return (x: number, y: number, z: number): Vec3 => {
    const ly = flipped ? -y : y
    const lz = flipped ? -z : z
    return [center[0] + x * c + lz * s, center[1] + ly, center[2] - x * s + lz * c]
  }
}

/** A shoji panel centered at local (x, y, z), as a placement (which wants its bottom edge). */
function panelAt(at: ReturnType<typeof frame>, height: number, x: number, y: number, z: number, yaw: number, lit: boolean): ShojiPlacement {
  const [px, py, pz] = at(x, y, z)
  return { position: [px, py - height / 2, pz], yaw, lit }
}

// --- The pieces ---------------------------------------------------------------------------

/**
 * A pillar hanging out of the dark: a tall shaft ending in a cross-shaped base (two crossed
 * beams, a cap where they meet, a short foot under each arm end), with a lantern beneath.
 */
function addPillar(out: ShaftLayout['pillars'], rand: Random, place: Placer, phase: () => number, base: number) {
  const length = Math.min(PILLAR_SHAFT[1], PILLAR_TOP - base)
  const spot = place({ y: base, minGap: 0.5, maxGap: 8, radius: PILLAR_ARM[0] / 2 + 0.2, below: 1.6, above: length })
  if (!spot) return
  const [x, y, z] = spot
  const yaw = rand() * Math.PI
  out.shafts.push({ position: [x, y + 0.6, z], yaw, scale: [1, length / PILLAR_SHAFT[1], 1] })
  out.arms.push({ position: [x, y + PILLAR_ARM[1] / 2, z], yaw }, { position: [x, y + PILLAR_ARM[1] / 2, z], yaw: yaw + Math.PI / 2 })
  out.caps.push({ position: [x, y + 0.3, z], yaw })
  const reach = PILLAR_ARM[0] / 2 - PILLAR_FOOT[0] / 2
  for (let k = 0; k < 4; k++) {
    const a = yaw + (k * Math.PI) / 2
    out.feet.push({ position: [x + Math.cos(a) * reach, y - 0.2, z - Math.sin(a) * reach], yaw })
  }
  const drop = 0.05 + (CORD_BASE + PILLAR_LANTERN_CORD) * PILLAR_LANTERN_SIZE
  out.lanterns.push({ position: [x, y - drop, z], yaw, phase: phase() })
}

/**
 * A room hung upside down: its floor slab on top, the lit shoji walls below it, and its roof
 * pointing down into the dark.
 */
function addRoom(out: ShaftLayout['rooms'], rand: Random, place: Placer, y: number) {
  const half = ROOM_HEIGHT / 2
  const reach = (SHAFT_ROOF[0] / 2) * Math.SQRT2
  const spot = place({ y, minGap: 1, maxGap: 8, radius: reach, below: half + SHAFT_ROOF[1] + 0.3, above: half + 0.3 })
  if (!spot) return
  const yaw = rand() * Math.PI * 2
  const at = frame(spot, yaw, true)
  const W = ROOM_SIZE / 2

  out.slabs.push({ position: at(0, -half - ROOM_SLAB[1] / 2, 0), yaw })
  for (const px of [-W, 0, W]) {
    for (const pz of [-W, 0, W]) {
      if (px !== 0 || pz !== 0) out.posts.push({ position: at(px, 0, pz), yaw })
    }
  }
  for (const by of [-half + ROOM_BEAM[1] / 2, half - ROOM_BEAM[1] / 2]) {
    for (const side of [-1, 1]) {
      out.beams.push({ position: at(0, by, side * W), yaw })
      out.beams.push({ position: at(side * W, by, 0), yaw: yaw + Math.PI / 2 })
    }
  }
  // Four walls, two bays each, two panels per bay; mostly lit.
  const [pw, ph] = ROOM_PANEL
  for (const side of [-1, 1]) {
    for (const bay of [-1, 1]) {
      for (const k of [-1, 1]) {
        const u = (bay * ROOM_SIZE) / 4 + (k * pw) / 2
        out.panels.push(panelAt(at, ph, u, 0, side * W, yaw, !chance(rand, 0.15)))
        out.panels.push(panelAt(at, ph, side * W, 0, u, yaw + Math.PI / 2, !chance(rand, 0.15)))
      }
    }
  }
  out.roofs.push({ position: at(0, half + 0.05, 0), yaw, pitch: Math.PI })
}

/**
 * A flight of stairs with nothing holding it up: steps, two stringers under their ends and a
 * landing at the top. Most stand level, some tilt, a few hang upside down. Level flights get
 * a standing lantern on the landing.
 */
function addFlight(out: ShaftLayout['stairs'], rand: Random, place: Placer, phase: () => number, y: number) {
  const n = randInt(rand, 7, 12)
  const length = n * RUN + STAIR_LANDING[2]
  const height = (n + 1) * RISE
  const spot = place({ y, minGap: 0.5, maxGap: 7, radius: length / 2 + 0.7, below: length / 2 + 0.5, above: length / 2 + 1.2 })
  if (!spot) return
  const roll = rand()
  const tilt = roll < 0.55 ? 0 : roll < 0.85 ? (chance(rand, 0.5) ? -1 : 1) * randRange(rand, 0.25, 0.6) : Math.PI
  const yaw = rand() * Math.PI * 2

  // Yaw about Y after a tilt about X (the same order as InstanceTransform), around the flight's middle.
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  const ct = Math.cos(tilt)
  const st = Math.sin(tilt)
  const at = (lx: number, ly: number, lz: number): Vec3 => {
    const x0 = lx
    const y0 = ly - height / 2
    const z0 = lz + length / 2
    const y1 = y0 * ct - z0 * st
    const z1 = y0 * st + z0 * ct
    return [spot[0] + x0 * c + z1 * s, spot[1] + y1, spot[2] - x0 * s + z1 * c]
  }

  for (let i = 0; i < n; i++) {
    out.steps.push({ position: at(0, (i + 1) * RISE - STEP[1] / 2, -(i + 0.5) * RUN), yaw, pitch: tilt })
  }
  const landingZ = -(n * RUN + STAIR_LANDING[2] / 2)
  out.landings.push({ position: at(0, height - STAIR_LANDING[1] / 2, landingZ), yaw, pitch: tilt })

  // Stringers run under the step ends, parallel to the line of nosings.
  const slope = Math.atan2(RISE, RUN)
  const span = (n - 1) * Math.hypot(RISE, RUN) + 0.5
  const midY = ((n + 1) * RISE) / 2 - STEP[1] / 2
  const midZ = -(n * RUN) / 2
  const below = 0.2
  for (const side of [-1, 1]) {
    out.stringers.push({
      position: at(side * (STEP[0] / 2 - 0.08), midY - Math.cos(slope) * below, midZ - Math.sin(slope) * below),
      yaw,
      pitch: tilt + slope,
      scale: [1, 1, span / STAIR_STRINGER[2]],
    })
  }
  if (tilt === 0) out.lanterns.push({ position: at(0, height, landingZ), yaw, phase: phase() })
}

/**
 * A tower of stories far out in the dark, every story ringed with shoji, most of them lit,
 * under a roof. Some hang upside down, roof first.
 */
function addTower(out: ShaftLayout['towers'], rand: Random, place: Placer, y: number) {
  const stories = randInt(rand, 4, 7)
  const height = stories * STORY_HEIGHT
  const roofRise = SHAFT_ROOF[1] * TOWER_ROOF_SCALE
  const spot = place({ y, minGap: 6, maxGap: 18, radius: 4.9, below: height / 2 + roofRise, above: height / 2 + roofRise })
  if (!spot) return
  const flipped = chance(rand, 0.4)
  const yaw = rand() * Math.PI * 2
  const at = frame(spot, yaw, flipped)
  const y0 = -height / 2
  const face = TOWER_BODY[0] / 2 + 0.02
  const [pw, ph] = TOWER_PANEL

  for (let k = 0; k < stories; k++) {
    const base = y0 + k * STORY_HEIGHT
    out.bodies.push({ position: at(0, base + TOWER_BODY[1] / 2, 0), yaw })
    out.eaves.push({ position: at(0, base + STORY_HEIGHT - TOWER_EAVE[1] / 2, 0), yaw })
    const dark = chance(rand, 0.15)
    for (const side of [-1, 1]) {
      for (let j = 0; j < 4; j++) {
        const u = (j - 1.5) * (pw + 0.15)
        const py = base + 0.5 + ph / 2
        out.panels.push(panelAt(at, ph, u, py, side * face, yaw, !dark && !chance(rand, 0.3)))
        out.panels.push(panelAt(at, ph, side * face, py, u, yaw + Math.PI / 2, !dark && !chance(rand, 0.3)))
      }
    }
  }
  const s = TOWER_ROOF_SCALE
  out.roofs.push({ position: at(0, -y0, 0), yaw, pitch: flipped ? Math.PI : 0, scale: [s, s, s] })
}
