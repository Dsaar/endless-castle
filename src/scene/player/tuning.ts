/** Every number that shapes how walking and looking feel. Distances in meters, angles in radians. */

const DEG = Math.PI / 180

/** Camera height above the path when standing. */
export const EYE_HEIGHT = 1.6

// --- Walking -------------------------------------------------------------------------------

/** Distance between footfalls: one footstep event and one head-bob dip per step. */
export const STEP_LENGTH = 0.8
/** Space / Shift+Space: one stride (a left and a right step). */
export const STRIDE = 2 * STEP_LENGTH
/**
 * Progress follows the target in two stages: a goal eases toward the target (rate per
 * second), then a critically damped spring follows the goal (seconds, roughly the lag).
 * The first stage makes acceleration ramp in too, so even a single wheel tick starts
 * gently instead of with a lurch.
 */
export const GOAL_LAMBDA = 8
export const SMOOTH_TIME = 0.32
/** Top speed (m/s), reached by scrolling fast. A brisk run. */
export const MAX_SPEED = 3.6
/** Normal walking pace (m/s). Head-bob grows from here up to MAX_SPEED. */
export const WALK_SPEED = 1.4
/** Above this speed (m/s) the player counts as running. */
export const RUN_SPEED = 2.4
/** The target can run at most this far ahead of (or behind) the player, so a huge flick can't queue a long run. */
export const MAX_LEAD = 8
/** Speed (m/s) at which the target moves while W / S / ↑ / ↓ is held. */
export const KEY_SPEED = 1.5
/** Wheel: one 100px notch is about one step. */
export const WHEEL_METERS_PER_PIXEL = 0.008
/** Touch: meters per pixel of vertical swipe. */
export const TOUCH_METERS_PER_PIXEL = 0.012
/** Touch: a flick keeps going for this many seconds' worth of its release speed. */
export const TOUCH_FLING_SECONDS = 0.2
/** Below this speed (m/s) the player is standing still: no bob, no recentering. */
export const STILL_SPEED = 0.15

// --- Looking -------------------------------------------------------------------------------

/** Drag look: radians per pixel for a mouse and for a finger. */
export const MOUSE_LOOK_PER_PIXEL = 0.16 * DEG
export const TOUCH_LOOK_PER_PIXEL = 0.22 * DEG
/** Pixels a finger must travel before a one-finger gesture picks walk (vertical) or look (horizontal). */
export const TOUCH_SLOP = 8
/** How far the drag look may turn from the path direction. */
export const LOOK_YAW_LIMIT = 60 * DEG
export const LOOK_PITCH_UP = 30 * DEG
export const LOOK_PITCH_DOWN = 40 * DEG
/** While walking, the drag look returns to center at this rate (about 1s to settle). */
export const RECENTER_LAMBDA = 3
/** Desktop look-around from the mouse position: at most this far from center. */
export const LOOK_AROUND_MAX = 4 * DEG
/** Vertical look-around is a little weaker than horizontal. */
export const LOOK_AROUND_PITCH_RATIO = 0.6
/** How lazily the look-around follows the mouse. */
export const LOOK_AROUND_LAMBDA = 2.5

// --- Head-bob ------------------------------------------------------------------------------

/** Vertical dip per step at walking pace and at top speed. */
export const BOB_WALK = 0.028
export const BOB_RUN = 0.05
/** Side-to-side sway, as a fraction of the dip (one sway per stride). */
export const BOB_SWAY = 0.45
/** Head roll that follows the sway, in radians per meter of sway. */
export const BOB_ROLL = 0.5
/** How quickly the bob fades in and out as speed changes. */
export const BOB_LAMBDA = 5

/** Longest frame step the simulation takes (after a tab switch, for example). */
export const MAX_DT = 0.1
