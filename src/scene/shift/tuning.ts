/** Every number that shapes a room shift (the biwa). Seconds and meters. */

/** How long the rooms take to leave, and the new ones to arrive. */
export const SHIFT_TIME = 1.5
/** Each room ahead starts this much after the one before it. */
export const SHIFT_STAGGER = 0.1
/** The shift is over (the old rooms are gone, the walk is let go) this long after it starts. */
export const SHIFT_END = SHIFT_TIME + SHIFT_STAGGER * 4 + 0.2

/** Standing still this long plucks the biwa… */
export const STILL_TIME = 2
/** …but only once per stop: walk at least this fast (m/s) before standing still counts again. */
export const MOVED_SPEED = 0.6
/** On average, one random shift per this many seconds of walking. */
export const RANDOM_MEAN = 90
/** A random shift only comes with at least this much of the current room left ahead (meters). */
export const RANDOM_ROOM_LEFT = 8
/** No shift comes sooner than this after the last one. */
export const COOLDOWN = 12

/** The camera shake: up in this long, then dying away over the rest of SHIFT_TIME. */
export const SHAKE_RISE = 0.12
/** Shake at full strength: position (m), and pitch / yaw / roll (radians). */
export const SHAKE_MOVE = 0.025
export const SHAKE_TURN = 0.006
export const SHAKE_ROLL = 0.012

/** The room you stand in lurches: sideways (m), down (m), a turn about you (radians). */
export const LURCH_SIDE = 0.22
export const LURCH_DROP = 0.1
export const LURCH_TURN = 0.035
