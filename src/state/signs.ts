/**
 * The castle's signs, as they happen, for the audio step (and the dev panel). One channel for
 * all of them, so a sound engine needs a single listener:
 *
 * - `heartbeat`: one beat, while a hidden figure is near. `bpm` rises as it gets closer.
 * - `presence`: a hidden figure's presence begins (you came within range) or ends (you walked
 *   away, or found it: then it ends at once).
 * - `ripple`: a dark ripple starts rolling through the halls (every few seconds while present).
 * - `lantern`: a lantern near you gutters: it flickers hard and dims for about a second.
 * - `biwa`: a biwa string is plucked and the rooms shift (forwarded from `emitBiwa`).
 */
export type SignEvent =
  | {
      kind: 'heartbeat'
      /** Beats per minute at this beat. */
      bpm: number
      /** How strong the presence is, 0 … 1. */
      level: number
      /** Index into FIGURES of the figure that is near, or −1 (dev: forced presence). */
      figure: number
    }
  | {
      kind: 'presence'
      state: 'begin' | 'end'
      /** Why it ended: walked out of range, or the figure was found. */
      reason?: 'away' | 'found'
      figure: number
      /** From the camera, meters (Infinity when forced from the dev panel). */
      distance: number
    }
  | {
      kind: 'ripple'
      level: number
      figure: number
      /** Seconds the ripple takes to cross the screen. */
      duration: number
    }
  | {
      kind: 'lantern'
      /** The lantern's light, in world space. */
      x: number
      y: number
      z: number
      /** From the camera, meters. */
      distance: number
      /** Seconds it gutters for. */
      duration: number
      /** Presence at the time, 0 … 1 (lanterns gutter more often near a hidden figure). */
      presence: number
    }
  | {
      kind: 'biwa'
      reason: 'still' | 'random' | 'dev'
    }

export type SignKind = SignEvent['kind']

type SignListener = (event: SignEvent) => void

const listeners = new Set<SignListener>()

/** Listen for every sign. Returns an unsubscribe function. */
export function onSign(listener: SignListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitSign(event: SignEvent) {
  for (const listener of listeners) listener(event)
}
