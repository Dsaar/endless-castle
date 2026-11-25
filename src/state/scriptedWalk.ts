/**
 * A stretch of the walk the player is carried along instead of walking: the quarter turn into a
 * side way at a fork, or the step across to a flight of stairs. `ForkDirector` tweens
 * `progress` with GSAP; while `active`, `Player` takes it as its position (head-bob and
 * footsteps carry on) and the walking input waits.
 *
 * Mutable module state read every frame, like `fallFx`: not a store, so nothing re-renders.
 */
export const scriptedWalk = {
  active: false,
  progress: 0,
}
