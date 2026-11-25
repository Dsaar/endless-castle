/** How forks ask and answer. Distances in meters, times in milliseconds. */

/** Closer than this to a fork's end, the player has arrived: the buttons show and the keys work. */
export const ARRIVE_DISTANCE = 0.4
/** Walk back further than this from a fork's end and the buttons go again. */
export const LEAVE_DISTANCE = 1.2
/**
 * A scroll gesture is a run of wheel events less than this apart. Only a gesture begun after
 * arriving can choose straight on, so the scroll that walked you in (and its trackpad momentum)
 * never does.
 */
export const WHEEL_GESTURE_GAP = 220
/** Pixels of forward scroll, in a fresh gesture, that choose straight on. */
export const WHEEL_STRAIGHT_PIXELS = 40
