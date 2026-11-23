/** Every number that shapes how the Fall feels. Times are in `world/segments/fall/timing.ts`. */

const DEG = Math.PI / 180

/** While the deck breaks, the player looks down at it… */
export const DECK_LOOK_PITCH = -13 * DEG
/** …then the camera pitches down this far as it falls… */
export const FALL_PITCH = -70 * DEG
/** …over this long… */
export const PITCH_DOWN_TIME = 1.3
/** …and levels out again over this long, finishing as the feet touch down. */
export const LEVEL_TIME = 1.9
/** The planks sag this far (meters) just before they give. */
export const DECK_SAG = 0.1
/** The forward drift (momentum) takes this long, then the fall is straight down. */
export const DRIFT_TIME = 4
/** The soft landing: knees bend this far (meters) and the head nods this much. */
export const LAND_DIP = 0.14
export const LAND_NOD = -3 * DEG

/** At top speed the field of view widens by this much (degrees). */
export const FOV_KICK = 7
/** Peak roll wobble at top speed (radians), and a little pitch wobble with it. */
export const WOBBLE_ROLL = 2.8 * DEG
export const WOBBLE_PITCH = 0.8 * DEG

/** Vignette at rest (also the PostEffects defaults) and at top speed. */
export const VIGNETTE_OFFSET = 0.3
export const VIGNETTE_DARKNESS = 0.7
export const FALL_VIGNETTE_OFFSET = 0.2
export const FALL_VIGNETTE_DARKNESS = 1.15

/**
 * A warm light carried along with the camera, this far ahead of it along the view, so the
 * deck and everything rushing past catch some light. It uses a slot in the light pool.
 */
export const CARRIED_LIGHT_AHEAD = 4
export const CARRIED_LIGHT_INTENSITY = 55
export const CARRIED_LIGHT_DISTANCE = 22
/** Its level while the deck breaks, before the fall (fraction of full). */
export const CARRIED_LIGHT_DECK = 0.45

/** At top speed the fog thins to this fraction of its density, so more of the shaft shows at once. */
export const FALL_FOG_SCALE = 0.55

/** If the camera is further than this from where the player stands (a dev teleport), the fall starts from the path instead. */
export const TAKEOVER_SNAP = 0.75
