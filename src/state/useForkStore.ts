import { create } from 'zustand'
import type { BranchChoice } from '../world/segment'

/** How a fork asks: ← ● → in a hall, ↑ ↓ on the stairs. */
export type ForkPicker = 'turn' | 'stairs'

export interface WaitingFork {
  /** The fork segment's id. */
  id: number
  picker: ForkPicker
  choices: readonly BranchChoice[]
}

/** Forks remembered in `chosen` (by id) behind the newest, enough to cover every segment the generator remembers. */
const CHOSEN_MEMORY = 64

/**
 * Where the walk divides. `ForkDirector` sets `waiting` when the player stops at a fork and
 * carries out a choice; the HUD shows the buttons; halls read `chosen` to close their doors.
 * Changes only at those moments, so it is safe to subscribe to.
 */
interface ForkState {
  /** The fork the player has stopped at, waiting for a way to be chosen. Null otherwise. */
  waiting: WaitingFork | null
  /** The way being taken, from the choice until the walk out of the fork has finished. Input waits. */
  taking: BranchChoice | null
  /** The way chosen at each recent fork, by segment id. */
  chosen: Readonly<Record<number, BranchChoice>>
  /** The latest choice asked for, for `ForkDirector` to carry out. `n` makes each one new. */
  request: { id: number; choice: BranchChoice; n: number } | null
  arrive: (fork: WaitingFork) => void
  leave: () => void
  /** Choose a way at the waiting fork. Ignored (false) if there is none, or it doesn't offer that way. */
  choose: (choice: BranchChoice) => boolean
  /** `ForkDirector`: the way at fork `id` is built; the walk out begins. */
  commit: (id: number, choice: BranchChoice) => void
  /** `ForkDirector`: the walk out is over. */
  settle: () => void
}

let requests = 0

export const useForkStore = create<ForkState>()((set, get) => ({
  waiting: null,
  taking: null,
  chosen: {},
  request: null,
  arrive: (waiting) => set({ waiting }),
  leave: () => set({ waiting: null }),
  choose: (choice) => {
    const { waiting, taking } = get()
    if (!waiting || taking || !waiting.choices.includes(choice)) return false
    set({ request: { id: waiting.id, choice, n: ++requests } })
    return true
  },
  commit: (id, choice) =>
    set((s) => {
      const chosen: Record<number, BranchChoice> = { [id]: choice }
      for (const [key, value] of Object.entries(s.chosen)) if (Number(key) > id - CHOSEN_MEMORY) chosen[Number(key)] = value
      return { chosen, waiting: null, taking: choice }
    }),
  settle: () => set({ taking: null }),
}))
