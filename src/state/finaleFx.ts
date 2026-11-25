/**
 * The finale's look, tweened by `FinaleOverlay` with GSAP and read every frame by the light
 * pool, the hemisphere fill and the red grade in `PostEffects`.
 *
 * Mutable module state, like `cameraFx`: not a store, so nothing re-renders.
 */
export const finaleFx = {
  /** 0: the castle as usual. 1: every light burns vermilion. */
  red: 0,
}
