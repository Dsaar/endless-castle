const DEG = Math.PI / 180

/** The silhouette's plane, meters. The figure stands about 1.8 m tall in it, feet at the bottom edge. */
export const FIGURE_WIDTH = 1
export const FIGURE_HEIGHT = 2
/** Where the figure counts as being, above its feet: for the gaze test, the click check and the glow. */
export const FIGURE_CENTER = 1.15
/** The head, above the middle: the second point checked for whether anything hides the figure. */
export const FIGURE_HEAD_ABOVE_CENTER = 0.45
/** The red glow behind it: an ellipse a little taller than wide. Also what a click hits. */
export const GLOW_SIZE: [number, number] = [2.3, 3.1]
/** How far behind the silhouette the glow sits, so the silhouette covers it. */
export const GLOW_BEHIND = 0.05
/** Brightness of the glow's vermilion; above 1 it blooms a little. */
export const GLOW_INTENSITY = 2.4
/** The glow fades with a thinner fog than the scene's, so a figure 40–60 m out still shows. */
export const GLOW_HAZE = 0.35
/** The glow breathes: seconds per breath, and how deep. */
export const GLOW_BREATH = 5
export const GLOW_BREATH_DEPTH = 0.18

/** The eye slits' brightness: kept low, so they are a faint glint rather than a light. */
export const EYES_INTENSITY = 1.15
/** How far in front of the silhouette the eyes sit, so they always draw over it. */
export const EYES_IN_FRONT = 0.005

/** A figure is found when it stays this close… */
export const FOUND_DISTANCE = 60
/** …and within this angle of the center of the view… */
export const FOUND_CONE = 9 * DEG
/** …for this long (seconds). */
export const FOUND_DWELL = 1
/** If something stands in the way when the dwell is up, look again this much later (seconds). */
export const OCCLUSION_RECHECK = 0.25
/** A press that moved further than this (pixels) was a drag to look, not a click. */
export const CLICK_SLOP = 6
