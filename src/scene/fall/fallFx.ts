import { smoothstep } from '../../lib/math'

/**
 * How fast the Fall is going right now, written by `FallDirector` every frame and read by the
 * speed effects (vignette, ember streaks). Mutable module state, like `frameStats`: not a
 * store, so nothing re-renders.
 */
export const fallFx = {
  /** Falling speed as a fraction of the top speed, 0 … 1. 0 whenever the player isn't falling. */
  speed: 0,
}

/** The speed effects come in quicker than the speed itself, then hold. 0 … 1. */
export function fallIntensity(speed: number) {
  return smoothstep(0, 0.7, speed)
}
