/**
 * Effects on the walking camera that scripted sequences tween with GSAP and `Player` applies
 * every frame: the Inverted Chamber's roll and a room shift's shake.
 *
 * Mutable module state read every frame, like `scriptedWalk`: not a store, so nothing re-renders.
 */
export const cameraFx = {
  /**
   * Roll about the walking direction, in radians: 0 upright, π upside down. The eye turns with
   * it about a line `rollPivot` above the path, so at π it stands on the ceiling.
   */
  roll: 0,
  /** Height above the path that the roll turns about (half the room's height). */
  rollPivot: 0,
  /** Camera shake, 0 … 1. */
  shake: 0,
}
