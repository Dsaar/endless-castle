import { chance, pick, randInt, type Random } from '../../../lib/random'
import { CORD_BASE } from '../../../scene/kit/lanternGeometry'
import type { LanternPlacement } from '../../../scene/kit/LanternInstances'
import type { ShojiPlacement } from '../../../scene/kit/ShojiInstances'
import type { BoxSpec, InstanceTransform, Vec3 } from '../../../scene/kit/types'
import { BAY, HALF_BAY, phaseStream, pierPairs, spreadAlong } from '../common'
import { litBays, shojiWall, WALL_HEIGHT } from '../shojiWall'

export const CORRIDOR_WIDTH = 2.4
const HALF = CORRIDOR_WIDTH / 2
export const PIER_DEPTH = 14
export const PIER: Vec3 = [0.26, PIER_DEPTH, 0.26]
export const BATTEN: Vec3 = [CORRIDOR_WIDTH, 0.06, 0.05]
export const BRACKET: Vec3 = [0.4, 0.06, 0.06]
export const LANTERN_SIZE = 0.95
export const LANTERN_CORD = 0.12
const BRACKET_Y = 1.98
/** Vermilion portal posts are a little stouter than the cedar ones. */
const PORTAL_POST = 0.17

/** How the two shoji walls are lit. */
export type CorridorLighting = 'both' | 'left' | 'right' | 'alternate' | 'sparse' | 'dark-run'

export interface CorridorParams {
  bays: number
  length: number
  lighting: CorridorLighting
  litLeft: boolean[]
  litRight: boolean[]
  /** A wall lantern every this many bays. */
  lanternEvery: number
  /** Wall lanterns face each other in pairs, or alternate sides. */
  pairedLanterns: boolean
  /** Bay lines where a vermilion portal (posts, lintel and tie) spans the corridor. */
  portals: number[]
  seed: number
}

export function generateCorridor(rand: Random): CorridorParams {
  const bays = randInt(rand, 9, 17)
  const lighting = pick<CorridorLighting>(rand, ['both', 'both', 'left', 'right', 'alternate', 'sparse', 'dark-run'])
  const wall = (side: 'left' | 'right') => {
    switch (lighting) {
      case 'both':
        return litBays(rand, bays, 'all')
      case 'left':
      case 'right':
        return litBays(rand, bays, lighting === side ? 'all' : 'none')
      case 'alternate':
        return litBays(rand, bays, 'alternate', side === 'left' ? 0 : 1)
      case 'sparse':
        return litBays(rand, bays, 'sparse')
      case 'dark-run':
        return litBays(rand, bays, 'dark-run')
    }
  }

  // One or two portals, well apart and away from the ends.
  const portals: number[] = []
  const wanted = chance(rand, 0.45) ? 2 : 1
  for (let tries = 0; portals.length < wanted && tries < 20; tries++) {
    const i = randInt(rand, 2, bays - 2)
    if (portals.every((q) => Math.abs(q - i) >= 3)) portals.push(i)
  }

  return {
    bays,
    length: bays * BAY,
    lighting,
    litLeft: wall('left'),
    litRight: wall('right'),
    lanternEvery: pick(rand, [2, 2, 3]),
    pairedLanterns: chance(rand, 0.4),
    portals: portals.sort((a, b) => a - b),
    seed: randInt(rand, 1, 999_999),
  }
}

export interface CorridorLayout {
  posts: InstanceTransform[]
  boxes: BoxSpec[]
  lacquer: BoxSpec[]
  panels: ShojiPlacement[]
  transoms: ShojiPlacement[]
  battens: InstanceTransform[]
  piers: InstanceTransform[]
  brackets: InstanceTransform[]
  lanterns: LanternPlacement[]
}

export function buildCorridorLayout(p: CorridorParams): CorridorLayout {
  const L = p.length
  const W = CORRIDOR_WIDTH
  const phase = phaseStream(p.seed)
  const left = shojiWall(-HALF, p.bays, p.litLeft, p.portals)
  const right = shojiWall(HALF, p.bays, p.litRight, p.portals)

  const pierZ = spreadAlong(L, Math.max(2, Math.round(p.bays / 3)))
  const boxes: BoxSpec[] = [
    ...left.boxes,
    ...right.boxes,
    // Board ceiling, and fascias closing the gap up to the roof's eaves outside.
    { size: [W + 0.4, 0.05, L], position: [0, WALL_HEIGHT + 0.025, -L / 2] },
    { size: [0.06, 0.36, L], position: [-HALF - 0.11, WALL_HEIGHT + 0.12, -L / 2] },
    { size: [0.06, 0.36, L], position: [HALF + 0.11, WALL_HEIGHT + 0.12, -L / 2] },
    // Headers over both open ends.
    { size: [W, 0.24, 0.16], position: [0, WALL_HEIGHT - 0.12, -0.08] },
    { size: [W, 0.24, 0.16], position: [0, WALL_HEIGHT - 0.12, -L + 0.08] },
    // Deep edge beams under the floor, and cross beams over the piers.
    { size: [0.14, 0.4, L], position: [-HALF + 0.07, -0.24, -L / 2] },
    { size: [0.14, 0.4, L], position: [HALF - 0.07, -0.24, -L / 2] },
    ...pierZ.map((z): BoxSpec => ({ size: [W + 0.4, 0.22, 0.22], position: [0, -0.55, z] })),
  ]

  // Vermilion portals: the one accent, used sparingly.
  const lacquer: BoxSpec[] = []
  for (const i of p.portals) {
    const z = -i * BAY
    for (const side of [-1, 1]) {
      lacquer.push({ size: [PORTAL_POST, WALL_HEIGHT, PORTAL_POST], position: [side * HALF, WALL_HEIGHT / 2, z] })
    }
    lacquer.push({ size: [W + PORTAL_POST, 0.16, PORTAL_POST], position: [0, WALL_HEIGHT - 0.08, z] })
    lacquer.push({ size: [W, 0.1, 0.12], position: [0, 2.26, z] })
  }

  const battens: InstanceTransform[] = []
  for (let k = 1; k < p.bays * 2; k++) battens.push({ position: [0, WALL_HEIGHT - BATTEN[1] / 2, -k * HALF_BAY] })

  // Wall lanterns on short brackets at the posts, at eye level beside the walk.
  const brackets: InstanceTransform[] = []
  const lanterns: LanternPlacement[] = []
  let side = -1
  for (let i = p.lanternEvery; i < p.bays; i += p.lanternEvery) {
    if (p.portals.includes(i)) continue
    for (const s of p.pairedLanterns ? [-1, 1] : [side]) {
      brackets.push({ position: [s * (HALF - BRACKET[0] / 2), BRACKET_Y, -i * BAY] })
      const y = BRACKET_Y - BRACKET[1] / 2 - (CORD_BASE + LANTERN_CORD) * LANTERN_SIZE
      lanterns.push({ position: [s * (HALF - 0.34), y, -i * BAY], phase: phase() })
    }
    side = -side
  }

  return {
    posts: [...left.posts, ...right.posts],
    boxes,
    lacquer,
    panels: [...left.panels, ...right.panels],
    transoms: [...left.transoms, ...right.transoms],
    battens,
    piers: pierPairs(pierZ, HALF - 0.3, -0.66, PIER_DEPTH),
    brackets,
    lanterns,
  }
}
