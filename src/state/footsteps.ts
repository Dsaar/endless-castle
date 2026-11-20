/** A footfall, emitted by `Player` about every STEP_LENGTH meters walked (forward or back). */
export interface Footstep {
  foot: 'left' | 'right'
  /** Walking speed at the moment of the step, m/s. */
  speed: number
  running: boolean
  /** Progress along the path, meters. */
  progress: number
}

type FootstepListener = (step: Footstep) => void

const listeners = new Set<FootstepListener>()

/** Listen for footsteps (audio, dev tools). Returns an unsubscribe function. */
export function onFootstep(listener: FootstepListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitFootstep(step: Footstep) {
  for (const listener of listeners) listener(step)
}
