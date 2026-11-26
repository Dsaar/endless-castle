import type { RandomSegmentKind } from '../world/segments/registry'
import { emitSign } from './signs'

/**
 * A biwa string is plucked somewhere in the castle, and the rooms move. Emitted when the
 * player has stood still for a while, now and then at random, or from the dev panel;
 * `ShiftDirector` carries out the shift. Every biwa is also sent on as a `biwa` sign (`onSign`),
 * so audio can hear it alongside the other signs.
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
  emitSign({ kind: 'biwa', reason: event.reason })
}
