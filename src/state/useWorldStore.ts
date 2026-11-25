import { create } from 'zustand'
import type { SegmentKind } from '../world/segment'
import type { RandomSegmentKind } from '../world/segments/registry'

/**
 * Where the player is in the castle, for the HUD and anything else that cares. Updated by
 * `World` only when the player crosses into another segment, so it is safe to subscribe to.
 */
interface WorldState {
  /** The seed the castle is generated from (`?seed=` in the URL to pin it). */
  seed: number
  /** Area name of the segment the player is in, e.g. "The Shoji Corridor". */
  area: string
  kanji: string
  kind: SegmentKind
  /**
   * Room number. The Gate is 0, the first room past it is 1. The walk out of a fork shares its
   * fork's number.
   */
  room: number
  /** Rooms that may still come before a Forking Hall is due (Infinity in the opening). For the dev panel. */
  untilJunction: number
  /** The deepest room reached so far. */
  furthestRoom: number
  /** Where the current segment begins and ends along the walk (meters). */
  segmentStart: number
  segmentEnd: number
  /** Dev: force every newly generated segment to be this kind. */
  forcedKind: RandomSegmentKind | null
  setSeed: (seed: number) => void
  setLocation: (location: {
    area: string
    kanji: string
    kind: SegmentKind
    room: number
    untilJunction: number
    segmentStart: number
    segmentEnd: number
  }) => void
  setForcedKind: (forcedKind: RandomSegmentKind | null) => void
}

export const useWorldStore = create<WorldState>()((set) => ({
  seed: 0,
  area: 'The Gate',
  kanji: '城門',
  kind: 'gate',
  room: 0,
  untilJunction: Number.POSITIVE_INFINITY,
  furthestRoom: 0,
  segmentStart: 0,
  segmentEnd: 0,
  forcedKind: null,
  setSeed: (seed) => set({ seed }),
  setLocation: (location) => set((s) => ({ ...location, furthestRoom: Math.max(s.furthestRoom, location.room) })),
  setForcedKind: (forcedKind) => set({ forcedKind }),
}))
