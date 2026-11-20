import { create } from 'zustand'

interface GameState {
  /** Whether the player chose to enter with sound. Set on the title screen. */
  soundEnabled: boolean
  setSoundEnabled: (soundEnabled: boolean) => void
  /** True once the intro camera move has arrived at the start of the bridge. */
  introComplete: boolean
  setIntroComplete: (introComplete: boolean) => void
  /** True while the guide scroll is open. Player input is paused and the canvas is dimmed. */
  guideOpen: boolean
  /** True once the guide has been opened at least once (it opens by itself the first time). */
  guideSeen: boolean
  openGuide: () => void
  closeGuide: () => void
}

export const useGameStore = create<GameState>()((set) => ({
  soundEnabled: true,
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  introComplete: false,
  setIntroComplete: (introComplete) => set({ introComplete }),
  guideOpen: false,
  guideSeen: false,
  openGuide: () => set({ guideOpen: true, guideSeen: true }),
  closeGuide: () => set({ guideOpen: false }),
}))
