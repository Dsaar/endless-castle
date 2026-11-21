import { chance, pick, randInt, randRange, type Random } from '../../../lib/random'
import { CORD_BASE } from '../../../scene/kit/lanternGeometry'
import type { LanternPlacement } from '../../../scene/kit/LanternInstances'
import type { ShojiPlacement } from '../../../scene/kit/ShojiInstances'
import type { BoxSpec, InstanceTransform, Vec3 } from '../../../scene/kit/types'
import { generatePavilion, type PavilionSpec } from '../../pieces/pavilionLayout'
import { BAY, phaseStream, pierPairs, spreadAlong } from '../common'
import { litBays, postZ, shojiWall, WALL_HEIGHT, type LitPattern } from '../shojiWall'

export const GALLERY_WIDTH = 2.4
const HALF = GALLERY_WIDTH / 2
/** Height of the eave beam's underside on the open side. */
export const EAVE_HEIGHT = 2.75
export const EAVE_POST: Vec3 = [0.16, EAVE_HEIGHT, 0.16]
const EAVE_BEAM_H = 0.55
export const TIE: Vec3 = [GALLERY_WIDTH - 0.1, 0.14, 0.12]
export const TOP_RAIL: Vec3 = [0.08, 0.07, BAY - 0.16]
export const LOW_RAIL: Vec3 = [0.06, 0.05, BAY - 0.16]
export const PIER_DEPTH = 14
export const PIER: Vec3 = [0.26, PIER_DEPTH, 0.26]
export const LANTERN_SIZE = 1.1
export const LANTERN_CORD = 0.4
/** The roof spans twice the gallery's width, ridge over the shoji wall, eave out over the void. */
export const ROOF_RISE = 1.6

export interface GalleryParams {
  bays: number
  length: number
  /** Which side the shoji wall is on (-1 left, 1 right). The other side is open to the void. */
  side: -1 | 1
  lighting: LitPattern
  lit: boolean[]
  /** A lantern hangs from the eave every this many bays. */
  lanternEvery: number
  pavilions: PavilionSpec[]
  seed: number
}

export function generateGallery(rand: Random): GalleryParams {
  const bays = randInt(rand, 8, 14)
  const length = bays * BAY
  const side = chance(rand, 0.5) ? -1 : 1
  const lighting = pick<LitPattern>(rand, ['all', 'all', 'alternate', 'sparse', 'dark-run'])
  const pavilions: PavilionSpec[] = []
  for (let i = randInt(rand, 1, 2); i > 0; i--) {
    pavilions.push(
      generatePavilion(rand, [-side * randRange(rand, 10, 22), randRange(rand, -6, 3), -length * randRange(rand, 0.15, 0.85)]),
    )
  }
  return {
    bays,
    length,
    side,
    lighting,
    lit: litBays(rand, bays, lighting),
    lanternEvery: pick(rand, [1, 2, 2]),
    pavilions,
    seed: randInt(rand, 1, 999_999),
  }
}

export interface GalleryLayout {
  wallPosts: InstanceTransform[]
  eavePosts: InstanceTransform[]
  boxes: BoxSpec[]
  panels: ShojiPlacement[]
  transoms: ShojiPlacement[]
  ties: InstanceTransform[]
  topRails: InstanceTransform[]
  lowRails: InstanceTransform[]
  piers: InstanceTransform[]
  lanterns: LanternPlacement[]
  /** Center of the roof: over the shoji wall. */
  roofX: number
}

export function buildGalleryLayout(p: GalleryParams): GalleryLayout {
  const L = p.length
  const phase = phaseStream(p.seed)
  const wall = shojiWall(p.side * HALF, p.bays, p.lit)
  const openX = -p.side * (HALF - 0.1)
  const pierZ = spreadAlong(L, Math.max(2, Math.round(p.bays / 3)))

  const boxes: BoxSpec[] = [
    ...wall.boxes,
    // The eave beam over the open side, deep enough to meet the roof's underside.
    { size: [0.18, EAVE_BEAM_H, L], position: [openX, EAVE_HEIGHT + EAVE_BEAM_H / 2, -L / 2] },
    // A board wall above the shoji, up into the roof, so nothing shows behind it.
    { size: [0.08, 2.3, L], position: [p.side * (HALF + 0.02), WALL_HEIGHT + 1.15, -L / 2] },
    // Under the floor: edge beams and cross beams over the piers.
    { size: [0.14, 0.4, L], position: [-HALF + 0.07, -0.24, -L / 2] },
    { size: [0.14, 0.4, L], position: [HALF - 0.07, -0.24, -L / 2] },
    ...pierZ.map((z): BoxSpec => ({ size: [GALLERY_WIDTH + 0.4, 0.22, 0.22], position: [0, -0.55, z] })),
  ]

  const eavePosts: InstanceTransform[] = []
  const ties: InstanceTransform[] = []
  for (let i = 0; i <= p.bays; i++) {
    const z = postZ(i, p.bays, EAVE_POST[0])
    eavePosts.push({ position: [openX, 0, z] })
    ties.push({ position: [(openX + p.side * HALF) / 2, EAVE_HEIGHT + TIE[1] / 2, z] })
  }

  // A plain two-rail balustrade between the eave posts, open to the void.
  const topRails: InstanceTransform[] = []
  const lowRails: InstanceTransform[] = []
  const lanterns: LanternPlacement[] = []
  for (let i = 0; i < p.bays; i++) {
    const z = -(i + 0.5) * BAY
    topRails.push({ position: [openX, 0.86, z] })
    lowRails.push({ position: [openX, 0.3, z] })
    if (i % p.lanternEvery === 0) {
      lanterns.push({ position: [openX, EAVE_HEIGHT - (CORD_BASE + LANTERN_CORD) * LANTERN_SIZE, z], phase: phase() })
    }
  }

  return {
    wallPosts: wall.posts,
    eavePosts,
    boxes,
    panels: wall.panels,
    transoms: wall.transoms,
    ties,
    topRails,
    lowRails,
    piers: pierPairs(pierZ, HALF - 0.3, -0.66, PIER_DEPTH),
    lanterns,
    roofX: p.side * HALF,
  }
}
