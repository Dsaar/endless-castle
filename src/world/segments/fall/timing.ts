/**
 * The Fall's script, in seconds from the moment the player steps onto the deck. Shared by
 * the deck (which planks drop when) and `FallDirector` (the camera), so the two stay in step.
 */

/** The first planks ahead crack. */
export const COLLAPSE_START = 0.2
/** The collapse runs away from the player at this many seconds per meter. */
export const RIPPLE_PER_METER = 0.09
/** Planks within this many meters of the player's feet hold until the floor gives. */
export const ISLAND = 0.9
/** The planks under the player give way… */
export const FLOOR_GIVES = 1.35
/** …and the camera starts to fall. */
export const FALL_START = 1.4
/** Seconds of accelerating fall, then of braking. About 6 s of falling in all. */
export const FALL_ACCEL = 4.6
export const FALL_BRAKE = 1.6
/** Feet touch the walkway. */
export const LANDING = FALL_START + FALL_ACCEL + FALL_BRAKE
/** Input unlocks once the knees have straightened. */
export const FALL_END = LANDING + 0.85

/** A plank's split: the halves part and their inner ends dip. */
export const PLANK_CRACK = 0.14
/** Then it falls this far, accelerating, over this long, and is hidden (far below, lost in the fog). */
export const PLANK_FALL = 3.7
export const PLANK_DROP = 110

/** The floor lurches as it goes: the player stumbles forward at least this far… */
const STUMBLE_MIN = 0.25
/** …plus this many meters per m/s of walking speed (momentum)… */
const STUMBLE_PER_SPEED = 0.45
/** …over this long. */
export const STUMBLE_TIME = 0.9

/**
 * Where on the deck the player ends up standing (local z, negative ahead), from how far onto
 * it they were (`along`, meters) and how fast they were walking (m/s).
 */
export function fallStandZ(along: number, speed: number) {
  return -(along + STUMBLE_MIN + STUMBLE_PER_SPEED * speed)
}

/**
 * When a deck piece at local `z` starts to crack. The planks ahead go first, running away
 * from the player; the island under their feet and the planks behind go with the player.
 * `jitter` is in [0, 1).
 */
export function plankDropTime(z: number, standZ: number, jitter: number) {
  const ahead = standZ - z
  if (ahead > ISLAND) return COLLAPSE_START + (ahead - ISLAND) * RIPPLE_PER_METER + jitter * 0.08
  const behind = Math.max(0, -ahead - ISLAND)
  return FLOOR_GIVES - PLANK_CRACK + behind * 0.06 + jitter * 0.05
}
