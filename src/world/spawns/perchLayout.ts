import { createRandom, randRange, type Random } from '../../lib/random'
import type { LanternPlacement } from '../../scene/kit/LanternInstances'
import type { ShojiPlacement } from '../../scene/kit/ShojiInstances'
import type { BoxSpec, Vec3 } from '../../scene/kit/types'
import { WALL_HEIGHT, WALL_KAMOI, WALL_PANEL, WALL_PANEL_SIZE, WALL_POST, WALL_SILL } from '../segments/shojiWall'
import type { PerchSpec } from './spots'

/**
 * A perch's pieces, in its own frame: floor top at y = 0, front (toward the walk) at +Z.
 *
 * - A deck: planks on edge beams, struts dangling into the void at uneven lengths, a few
 *   boards sticking out of one broken end, perhaps railings (with gaps), and a standing lantern.
 * - A balcony: a floor and railing in front of a short wall of lit shoji under a small roof, as
 *   if the rest of the building had been lost in the dark.
 */
export interface PerchLayout {
  boxes: BoxSpec[]
  panels: ShojiPlacement[]
  lanterns: LanternPlacement[]
  roof: { position: Vec3; size: Vec3 } | null
}

const SLAB = 0.12
const RAIL_HEIGHT = 0.88
const POST = 0.08
const STRUT = 0.18

export function buildPerchLayout(p: PerchSpec): PerchLayout {
  const rand = createRandom(p.seed)
  return p.kind === 'deck' ? deckLayout(p, rand) : balconyLayout(p, rand)
}

function deckLayout(p: PerchSpec, rand: Random): PerchLayout {
  const L = p.length
  const W = p.width
  const boxes: BoxSpec[] = [
    { size: [L, SLAB, W], position: [0, -SLAB / 2, 0], grain: 0 },
    // Edge beams under the front and back, and cross beams near the ends.
    { size: [L, 0.3, 0.14], position: [0, -SLAB - 0.15, W / 2 - 0.07] },
    { size: [L, 0.3, 0.14], position: [0, -SLAB - 0.15, -W / 2 + 0.07] },
    { size: [0.2, 0.2, W + 0.2], position: [L / 2 - 0.35, -SLAB - 0.4, 0] },
    { size: [0.2, 0.2, W + 0.2], position: [-L / 2 + 0.35, -SLAB - 0.4, 0] },
  ]
  struts(boxes, rand, L / 2 - 0.35, W / 2 - 0.2, -SLAB - 0.5)

  // The broken end: boards of uneven length running on past the beams, away from the lantern.
  const broken = -p.lanternSide
  for (let z = -W / 2 + 0.15; z < W / 2 - 0.1; z += 0.26) {
    if (rand() < 0.35) continue
    const reach = randRange(rand, 0.2, 1.1)
    boxes.push({ size: [reach, 0.05, 0.22], position: [broken * (L / 2 + reach / 2), -0.03, z], grain: 0 })
  }

  if (p.rails) {
    for (const zSide of [-1, 1]) {
      const z = zSide * (W / 2 - POST / 2)
      const posts = Math.max(2, Math.round(L / 1.5) + 1)
      const xs = Array.from({ length: posts }, (_, i) => -L / 2 + POST / 2 + ((L - POST) * i) / (posts - 1))
      xs.forEach((x, i) => {
        boxes.push({ size: [POST, RAIL_HEIGHT, POST], position: [x, RAIL_HEIGHT / 2, z], grain: 1 })
        // Rails between posts, with a gap here and there where one has fallen.
        if (i > 0 && rand() > 0.2) {
          const mid = (x + xs[i - 1]) / 2
          const span = x - xs[i - 1]
          boxes.push({ size: [span, 0.05, 0.05], position: [mid, RAIL_HEIGHT - 0.03, z] })
          if (rand() > 0.3) boxes.push({ size: [span, 0.04, 0.04], position: [mid, 0.38, z] })
        }
      })
    }
  }

  const lanterns: LanternPlacement[] = [
    { position: [p.lanternSide * (L / 2 - 0.45), 0, -W / 2 + 0.4], phase: p.seed % 100 },
  ]
  return { boxes, panels: [], lanterns, roof: null }
}

function balconyLayout(p: PerchSpec, rand: Random): PerchLayout {
  const L = p.length
  const W = p.width
  const [panelW] = WALL_PANEL_SIZE
  const wallZ = -W / 2
  const boxes: BoxSpec[] = [
    { size: [L + 0.2, 0.16, W + 0.1], position: [0, -0.08, 0.05], grain: 0 },
    { size: [L + 0.2, 0.3, 0.16], position: [0, -0.31, W / 2 - 0.05] },
    // The wall: corner posts, sill, door head, and boards above up to the eave.
    { size: [WALL_POST, WALL_HEIGHT, WALL_POST], position: [-L / 2 + WALL_POST / 2, WALL_HEIGHT / 2, wallZ], grain: 1 },
    { size: [WALL_POST, WALL_HEIGHT, WALL_POST], position: [L / 2 - WALL_POST / 2, WALL_HEIGHT / 2, wallZ], grain: 1 },
    { size: [L, WALL_SILL, 0.1], position: [0, WALL_SILL / 2, wallZ] },
    { size: [L, WALL_KAMOI, 0.1], position: [0, WALL_SILL + WALL_PANEL + WALL_KAMOI / 2, wallZ] },
    {
      size: [L, WALL_HEIGHT - (WALL_SILL + WALL_PANEL + WALL_KAMOI), 0.06],
      position: [0, (WALL_HEIGHT + WALL_SILL + WALL_PANEL + WALL_KAMOI) / 2, wallZ - 0.02],
    },
    // The railing along the front.
    { size: [L, 0.06, 0.06], position: [0, RAIL_HEIGHT, W / 2 - 0.04] },
    { size: [L, 0.04, 0.04], position: [0, 0.32, W / 2 - 0.04] },
  ]
  for (const x of [-L / 2 + 0.05, 0, L / 2 - 0.05]) {
    boxes.push({ size: [POST, RAIL_HEIGHT, POST], position: [x, RAIL_HEIGHT / 2, W / 2 - 0.04], grain: 1 })
  }
  struts(boxes, rand, L / 2 - 0.25, W / 2 - 0.2, -0.46)

  // Shoji across the wall, between the corner posts: all but one lit.
  const count = Math.floor((L - WALL_POST * 2) / panelW)
  const dark = Math.floor(rand() * count)
  const panels: ShojiPlacement[] = Array.from({ length: count }, (_, i) => ({
    position: [-((count - 1) * panelW) / 2 + i * panelW, WALL_SILL, wallZ + 0.04] as Vec3,
    lit: i !== dark,
  }))

  return {
    boxes,
    panels,
    lanterns: [],
    // Ridge along the wall, eaves out over the balcony.
    roof: { position: [0, WALL_HEIGHT + 0.05, -0.1], size: [W + 1.4, 0.8, L + 1] },
  }
}

/** Struts hanging from under the corners into the void, at uneven lengths. */
function struts(boxes: BoxSpec[], rand: Random, x: number, z: number, top: number) {
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const len = randRange(rand, 2.5, 10)
      boxes.push({ size: [STRUT, len, STRUT], position: [sx * x, top - len / 2, sz * z], grain: 1 })
    }
  }
}
