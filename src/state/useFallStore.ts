import { create } from 'zustand'

/**
 * `idle` until the player steps onto the Fall's deck, `falling` while the scripted fall runs
 * (all walking and looking input is locked), `done` once they have landed. It only moves
 * forward, once per visit.
 */
export type FallPhase = 'idle' | 'falling' | 'done'

interface FallState {
  phase: FallPhase
  /** Where on the deck the player ends up standing (the segment's local z), so the planks around them hold longest. */
  standZ: number
  begin: (standZ: number) => void
  finish: () => void
}

/** The Fall's progress, changed by `FallDirector` and read by the deck, `Player` and the input. Safe to subscribe to. */
export const useFallStore = create<FallState>()((set) => ({
  phase: 'idle',
  standZ: 0,
  begin: (standZ) => set({ phase: 'falling', standZ }),
  finish: () => set({ phase: 'done' }),
}))
