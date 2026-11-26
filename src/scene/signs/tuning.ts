// --- Presence: a hidden figure is near ------------------------------------------------------

/** An unfound figure closer than this (meters) makes itself felt… */
export const PRESENCE_RANGE = 40
/** …and has to be this much further away before it lets go (so the edge doesn't flutter). */
export const PRESENCE_RANGE_HYSTERESIS = 3
/** At this distance or closer, the presence is at full strength. */
export const PRESENCE_NEAR = 6
/** Strength at the edge of the range, so there is a clear beginning (0 … 1). */
export const PRESENCE_FLOOR = 0.25
/** How fast it builds up (rate per second: about 95% of the way in 3 / rate seconds). */
export const PRESENCE_RISE = 0.9
/** How fast it fades as you walk away. */
export const PRESENCE_FALL = 0.6
/** How fast it goes once the figure is found (a reset, not a slow fade). */
export const PRESENCE_RESET = 7
/** Below this, the presence counts as gone (no heartbeat, no ripples). */
export const PRESENCE_ON = 0.02

/** The vignette at full presence (it comes in from the base values in `fall/tuning.ts`). */
// (Kept off the rim's middle, where the warp and color split show.)
export const PRESENCE_VIGNETTE_OFFSET = 0.22
export const PRESENCE_VIGNETTE_DARKNESS = 1
/** Extra vignette darkness on each heartbeat, at full presence. */
export const HEARTBEAT_VIGNETTE = 0.2
/** Share of the color taken out at full presence (0 … 1). */
export const PRESENCE_DESATURATION = 0.5

/** How far the screen's rim is pulled in at full presence (in UV, at the corners). */
export const EDGE_WARP = 0.032
/** How far the red and blue channels split at the corners at full presence (UV). */
export const EDGE_ABERRATION = 0.018
/** How fast the rim's wave runs (1: about a 7 s cycle). */
export const EDGE_WAVE_SPEED = 1.6
/** With reduced motion: the warp and split scaled by this, and the wave held still. */
export const REDUCED_MOTION_WARP = 0.35

/** The heartbeat at the edge of the range, and at full presence (beats per minute). */
export const HEARTBEAT_BPM_FAR = 54
export const HEARTBEAT_BPM_NEAR = 116
/** The second beat ("dub") of each heartbeat, seconds after the first, and how loud. */
export const HEARTBEAT_DUB_DELAY = 0.24
export const HEARTBEAT_DUB_SHARE = 0.6
/** How fast each beat's pulse dies away (per second). */
export const HEARTBEAT_DECAY = 9

/** Ripples need at least this much presence. */
export const RIPPLE_MIN = 0.1
/** Seconds between ripples at the edge of the range, and at full presence (± jitter). */
export const RIPPLE_EVERY_FAR = 8
export const RIPPLE_EVERY_NEAR = 3.5
export const RIPPLE_JITTER = 1
/** Seconds a ripple takes to roll across the screen. */
export const RIPPLE_DURATION = 2.6
/** How far its front travels, in screen heights (enough to cross the screen from off one edge). */
export const RIPPLE_REACH = 2.6
/** Width of the dark front (screen heights). */
export const RIPPLE_WIDTH = 0.18
/** How much of the light the front takes away at full presence. */
export const RIPPLE_DARK = 0.8
/** How far the front bends the image as it passes (UV). */
export const RIPPLE_WARP = 0.012
/** Where an off-screen figure's ripple starts: this far out from the middle (in NDC, 1 = the edge). */
export const RIPPLE_OFFSCREEN = 1.5

// --- The guttering lantern -------------------------------------------------------------------

/** Seconds a lantern gutters for. */
export const GUTTER_DURATION = 1.05
/** Seconds between gutters with no figure near (a random pick in this range). */
export const GUTTER_EVERY_MIN = 12
export const GUTTER_EVERY_MAX = 28
/** At full presence, the wait runs this many times faster on top of the usual (so 1 + this). */
export const GUTTER_PRESENCE_RATE = 7
/** The first gutter after entering waits at least this long (seconds). */
export const GUTTER_FIRST_MIN = 6
/** Only a lantern this close to the camera gutters (meters)… */
export const GUTTER_REACH = 12
/** …and only one on screen: inside this share of the view from the middle (1 = the edge). */
export const GUTTER_IN_VIEW = 0.85
/** Nearer lanterns are likelier (weight 1 / distance, counting anything closer as this close). */
export const GUTTER_NEAR = 3
/** No lantern near: look again this much later (seconds). */
export const GUTTER_RETRY = 2
/** Light left at the bottom of the dip (share of its usual intensity). */
export const GUTTER_LOW = 0.06
/** How often the hard flicker at the start changes, per second. */
export const GUTTER_STUTTER_RATE = 14
