import type { Vec3 } from '../../../scene/kit/types'

/**
 * Dimensions of the opening segment, in meters. The player faces -Z: the bridge starts at
 * z = 0 and runs over the void to a landing, where the gate stands.
 */

/** Camera height when standing. */
export const EYE_HEIGHT = 1.6

export const BRIDGE_LENGTH = 18
export const BRIDGE_WIDTH = 3
/** z of the bridge's far end, where the landing begins. */
export const BRIDGE_END_Z = -BRIDGE_LENGTH

export const LANDING_WIDTH = 16
export const LANDING_DEPTH = 9
export const LANDING_CENTER_Z = BRIDGE_END_Z - LANDING_DEPTH / 2

/** The gate's front post line. */
export const GATE_Z = BRIDGE_END_Z - 2.4
export const GATE_DEPTH = 5
export const GATE_CENTER_Z = GATE_Z - GATE_DEPTH / 2
/** x of the four post lines: the doors sit between the inner pair, shoji in the outer bays. */
export const GATE_POSTS_X = [-5.4, -1.8, 1.8, 5.4] as const
export const GATE_POST = 0.36
/** Clear width of each bay between posts. */
export const GATE_BAY = GATE_POSTS_X[2] - GATE_POSTS_X[1] - GATE_POST

/** Lower story: top of the posts, where the balcony deck sits. */
export const LOWER_HEIGHT = 3.68
/** Top of the doors' head rail. */
export const DOOR_HEIGHT = 3.0
/** Top surface of the balcony deck / upper floor. */
export const UPPER_FLOOR = 3.72
/** Top of the upper story's posts. */
export const UPPER_TOP = 6.3

/** The intro dolly: from far back over the void to the start of the bridge. */
export const INTRO_START: Vec3 = [0, 2.6, 24]
export const INTRO_END: Vec3 = [0, EYE_HEIGHT, 1.5]
/** Downward tilt (radians) at the start of the dolly, easing to level. */
export const INTRO_START_PITCH = -0.05
export const INTRO_DURATION = 5
