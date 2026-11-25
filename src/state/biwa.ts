import type { RandomSegmentKind } from '../world/segments/registry'

/**
 * A biwa string is plucked somewhere in the castle, and the rooms move. Emitted when the
 * player has stood still for a while, now and then at random, or from the dev panel;
 * `ShiftDirector` carries out the shift, and audio can listen for it later.
 */
export interface BiwaEvent {
  reason: 'still' | 'random' | 'dev'
  /** Dev: make the first new room ahead this kind. */
  kind?: RandomSegmentKind
}

type BiwaListener = (event: BiwaEvent) => void

const listeners = new Set<BiwaListener>()

/** Listen for biwa events. Returns an unsubscribe function. */
export function onBiwa(listener: BiwaListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitBiwa(event: BiwaEvent) {
  for (const listener of listeners) listener(event)
}
