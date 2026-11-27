/** Every level and shape in the sound. Gains are linear (1 = full scale), times in seconds. */

// --- The mix ---------------------------------------------------------------------------------

/** Master level while sound is on, and how fast the toggle fades (time constant). */
export const MASTER_GAIN = 0.9
export const MASTER_FADE = 0.12
/** Sound off: the context is suspended this long after the fade, to save the CPU. */
export const SUSPEND_AFTER = 0.6
/** While the guide is open, everything is muffled through a lowpass at this cutoff (Hz). */
export const MUFFLE_CUTOFF = 650
export const MUFFLE_FADE = 0.25
/** The hall's reverb: length of the made-up impulse response, and how much each sound sends. */
export const HALL_SECONDS = 2.6
export const HALL_RETURN = 0.55

// --- Ambience --------------------------------------------------------------------------------

/** Seconds for the ambience to fade in on entering, and out again. */
export const AMBIENCE_FADE_IN = 4
export const AMBIENCE_FADE_OUT = 2.5
/** The wind: a band of brown noise whose center drifts with a slow LFO, plus slow gusts. */
export const WIND_GAIN = 0.24
export const WIND_CUTOFF = 360
export const WIND_SWEEP = 220
export const WIND_LFO_HZ = 0.045
export const GUST_LFO_HZ = 0.11
export const GUST_DEPTH = 0.45
/** The drone: a low root with a fifth and a slightly detuned twin, through a lowpass. */
export const DRONE_ROOT = 41.2
export const DRONE_GAIN = 0.055
export const DRONE_CUTOFF = 180
/** A hidden figure's presence: the drone grows and opens, an uneasy beating tone comes in, the wind drops. */
export const PRESENCE_DRONE = 0.7
export const PRESENCE_CUTOFF = 260
export const PRESENCE_UNEASE = 0.035
export const PRESENCE_WIND_DROP = 0.45
export const PRESENCE_GLIDE = 0.8

// --- One-shots -------------------------------------------------------------------------------

/** Footsteps on wood: the noise click and the thump, ± this much random pitch. */
export const STEP_GAIN = 0.5
export const STEP_PITCH_JITTER = 0.09
export const STEP_HALL = 0.12
/** Now and then a board creaks under a walking (not running) step. */
export const STEP_CREAK_CHANCE = 0.08

/** A shoji sliding (open or shut), and the Gate's leaves. */
export const DOOR_GAIN = 0.8
export const GATE_GAIN = 0.75
export const DOOR_HALL = 0.35

/** A guttering lantern's crackle. */
export const CRACKLE_GAIN = 1
export const CRACKLE_HALL = 0.1

/** The biwa, and how much of it rings on in the hall. */
export const BIWA_GAIN = 0.55
export const BIWA_HALL = 0.6
/** A room shift's low rumble under the biwa. */
export const RUMBLE_GAIN = 0.35

/** The heartbeat (dry: it is felt, not in the room). */
export const HEART_GAIN = 0.75
/** A dark ripple's low swell. */
export const RIPPLE_GAIN = 0.28

/** The Fall: the rising roar, the deck cracking and giving, the landing. */
export const ROAR_GAIN = 0.6
export const CRACK_GAIN = 0.6
export const LAND_GAIN = 0.7

/** Lanterns and doors are placed with equal-power panners: full level within this distance (m)… */
export const PAN_REF_DISTANCE = 2.5
/** …and silent past this. */
export const PAN_MAX_DISTANCE = 40
