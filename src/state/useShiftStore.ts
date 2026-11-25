import { create } from 'zustand'
import type { Segment } from '../world/segment'
import type { RandomSegmentKind } from '../world/segments/registry'
import type { SegmentMotion } from '../world/shift/segmentMotion'

/** A room shift under way. */
export interface ActiveShift {
  /** Counts shifts, from 1. */
  n: number
  /** Segments taken out of the walk that are still on screen, leaving. */
  departing: readonly Segment[]
  /** The move of every segment that moves, by React key: leaving, arriving, or the room you're in. */
  motions: ReadonlyMap<string, SegmentMotion>
}

/**
 * Room shifts. `ShiftDirector` starts and ends them; `World` draws the rooms leaving and moves
 * every segment named in `motions`. Changes only when a shift starts or ends, or when the dev
 * panel rebuilds the rooms ahead, so it is safe to subscribe to.
 */
interface ShiftState {
  active: ActiveShift | null
  /** Bumped whenever the generator replaced segments, so `World` re-renders the window. */
  version: number
  /** Dev: the latest ask for a room of `kind` next, at once, with you at its door. `n` makes each one new. */
  request: { kind: RandomSegmentKind; n: number } | null
  begin: (shift: ActiveShift) => void
  end: () => void
  rebuilt: () => void
  /** Dev: rebuild the rooms ahead so the next one is `kind`, and take the player to its door. */
  requestRoom: (kind: RandomSegmentKind) => void
}

let requests = 0

export const useShiftStore = create<ShiftState>()((set) => ({
  active: null,
  version: 0,
  request: null,
  begin: (active) => set((s) => ({ active, version: s.version + 1 })),
  end: () => set({ active: null }),
  rebuilt: () => set((s) => ({ version: s.version + 1 })),
  requestRoom: (kind) => set({ request: { kind, n: ++requests } }),
}))
