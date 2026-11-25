import type { FigureArea } from '../figures'

/**
 * How likely a room of each area type is to hold its figure. The Central Abyss is rare already,
 * so its figure is always there. Decided once per room from its seed, so a room is the same
 * every time you see it.
 */
export const SPAWN_CHANCE: Record<FigureArea, number> = {
  threshold: 0.5,
  walkway: 0.5,
  gallery: 0.6,
  junction: 0.5,
  stairwell: 0.7,
  abyss: 1,
}

/** Dev: put every figure in every room of its area type. Mutable; read when a room mounts. */
export const spawnOverride = {
  always: false,
}
