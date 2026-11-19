import { create } from 'zustand'

interface GameState {
  /** Whether the player chose to enter with sound. Set on the title screen. */
  soundEnabled: boolean
  setSoundEnabled: (soundEnabled: boolean) => void
}

export const useGameStore = create<GameState>()((set) => ({
  soundEnabled: true,
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
}))
