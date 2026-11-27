import { Vector3, type Object3D } from 'three'

/**
 * A door moves: shoji sliding open in a Tatami Room or the Shoji Corridor, a Forking Hall's
 * doors sliding shut, or the Gate's heavy leaves swinging in. Emitted by the door components
 * as their tween starts (not when they snap on mount), for audio.
 */
export interface DoorEvent {
  kind: 'slide-open' | 'slide-close' | 'gate'
  /** The middle of the doorway, in world space. */
  x: number
  y: number
  z: number
  /** Seconds the move takes. */
  duration: number
}

type DoorListener = (event: DoorEvent) => void

const listeners = new Set<DoorListener>()

/** Listen for doors. Returns an unsubscribe function. */
export function onDoor(listener: DoorListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitDoor(event: DoorEvent) {
  for (const listener of listeners) listener(event)
}

const scratch = new Vector3()

/** Emits a door event at `object`'s world position (the doorway's group). */
export function emitDoorAt(object: Object3D, kind: DoorEvent['kind'], duration: number) {
  if (listeners.size === 0) return
  object.updateWorldMatrix(true, false)
  object.getWorldPosition(scratch)
  emitDoor({ kind, x: scratch.x, y: scratch.y, z: scratch.z, duration })
}
