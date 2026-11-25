/**
 * A figure is only ever in one place at once. Two rooms of the same area type can be mounted
 * together (a Crossroads' previews, or the same kind two rooms apart). Each room with a spot
 * for a figure joins its queue; the first in line holds the figure, and when that room
 * unmounts the next one takes it. The others show their perch empty.
 *
 * Mutable module state with a tiny subscription, for `useSyncExternalStore`.
 */
const queues = new Map<number, object[]>()
const listeners = new Set<() => void>()

function changed() {
  for (const listener of listeners) listener()
}

/** Queues `room` for figure `index`. Returns a function that leaves the queue. */
export function joinFigure(index: number, room: object): () => void {
  const queue = queues.get(index) ?? []
  queues.set(index, queue)
  queue.push(room)
  changed()
  return () => {
    const i = queue.indexOf(room)
    if (i >= 0) queue.splice(i, 1)
    changed()
  }
}

/** The room holding figure `index` now, if any. */
export function figureHolder(index: number): object | undefined {
  return queues.get(index)?.[0]
}

export function subscribeClaims(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
