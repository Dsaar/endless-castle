import { createRandom, pick, randInt, randRange, type Random } from '../../lib/random'
import type { ShojiPlacement } from '../../scene/kit/ShojiInstances'
import type { BoxSpec, Vec3 } from '../../scene/kit/types'

/** Every pavilion's panels are this wide, so one instanced set serves all four walls. */
export const PAVILION_PANEL = 0.85
const POST = 0.2
/** Wall lengths that fit whole panels between the corner posts (3 to 6 panels). */
const SIDES = [3, 4, 5, 6].map((n) => POST + PAVILION_PANEL * n)

/** A small building floating in the void near the walk. */
export interface PavilionSpec {
  /** Center of the floor, in the segment's frame. */
  position: Vec3
  yaw: number
  width: number
  depth: number
  /** Wall height. */
  height: number
  /** Share of panels that are lit. */
  litShare: number
  /** Gentle vertical bob: period (s) and phase. */
  bobPeriod: number
  bobPhase: number
  seed: number
}

/** A pavilion at `position` with random proportions. */
export function generatePavilion(rand: Random, position: Vec3): PavilionSpec {
  return {
    position,
    yaw: rand() * Math.PI * 2,
    width: pick(rand, SIDES),
    depth: pick(rand, SIDES.slice(0, 3)),
    height: randRange(rand, 2.1, 2.7),
    litShare: randRange(rand, 0.55, 0.95),
    bobPeriod: randRange(rand, 9, 15),
    bobPhase: rand() * Math.PI * 2,
    seed: randInt(rand, 1, 999_999),
  }
}

export interface PavilionLayout {
  boxes: BoxSpec[]
  panels: ShojiPlacement[]
}

/** The pavilion's frame and walls, in its own frame (floor center at the origin). */
export function buildPavilionLayout(p: PavilionSpec): PavilionLayout {
  const rand = createRandom(p.seed)
  const { width: w, depth: d, height: h } = p
  const boxes: BoxSpec[] = [
    // Platform, sills and the beam band at the top of the walls.
    { size: [w + 0.6, 0.32, d + 0.6], position: [0, -0.16, 0] },
    { size: [w + 0.3, 0.22, 0.2], position: [0, h + 0.11, d / 2] },
    { size: [w + 0.3, 0.22, 0.2], position: [0, h + 0.11, -d / 2] },
    { size: [0.2, 0.22, d + 0.3], position: [w / 2, h + 0.11, 0] },
    { size: [0.2, 0.22, d + 0.3], position: [-w / 2, h + 0.11, 0] },
  ]
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      boxes.push({ size: [POST, h + 0.22, POST], position: [(sx * w) / 2, (h + 0.22) / 2, (sz * d) / 2] })
      // Struts hanging from under the corners into the void, at uneven lengths.
      const len = randRange(rand, 2.5, 9)
      boxes.push({ size: [0.22, len, 0.22], position: [sx * (w / 2 - 0.1), -0.32 - len / 2, sz * (d / 2 - 0.1)] })
    }
  }
  // A long keel post under the middle, lost in the fog.
  boxes.push({ size: [0.3, 16, 0.3], position: [0, -8.3, 0] })

  const panels: ShojiPlacement[] = []
  const wall = (length: number, place: (offset: number) => [number, number, number], yaw: number) => {
    const n = Math.round((length - POST) / PAVILION_PANEL)
    for (let i = 0; i < n; i++) {
      const offset = -length / 2 + POST / 2 + PAVILION_PANEL * (i + 0.5)
      panels.push({ position: place(offset), yaw, lit: rand() < p.litShare })
    }
  }
  wall(w, (o) => [o, 0, d / 2], 0)
  wall(w, (o) => [o, 0, -d / 2], 0)
  wall(d, (o) => [w / 2, 0, o], Math.PI / 2)
  wall(d, (o) => [-w / 2, 0, o], Math.PI / 2)

  return { boxes, panels }
}
