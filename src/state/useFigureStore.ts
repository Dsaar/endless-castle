import { create } from 'zustand'

/** How many hidden figures the castle holds. */
export const FIGURE_COUNT = 6

/** Which of the six hidden figures the player has found, by slot (0 to FIGURE_COUNT - 1). */
interface FigureState {
  found: readonly boolean[]
  markFound: (index: number) => void
  resetFound: () => void
}

const none = () => Array.from({ length: FIGURE_COUNT }, () => false)

export const useFigureStore = create<FigureState>()((set) => ({
  found: none(),
  markFound: (index) =>
    set((s) => (s.found[index] ? s : { found: s.found.map((f, i) => f || i === index) })),
  resetFound: () => set({ found: none() }),
}))
