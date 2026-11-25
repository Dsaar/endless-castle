import { create } from 'zustand'

interface GameState {
  /** False on the title screen, true once the player has entered the castle. */
  entered: boolean
  enter: () => void
  /** Back to the title screen (the castle unmounts). */
  returnToTitle: () => void
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
  /** True from the moment the sixth figure is found until the title screen: input is locked, nothing else happens. */
  finale: boolean
  startFinale: () => void
}

export const useGameStore = create<GameState>()((set) => ({
  entered: false,
  enter: () => set({ entered: true }),
  returnToTitle: () => set({ entered: false }),
  soundEnabled: true,
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  introComplete: false,
  setIntroComplete: (introComplete) => set({ introComplete }),
  guideOpen: false,
  guideSeen: false,
  openGuide: () => set({ guideOpen: true, guideSeen: true }),
  closeGuide: () => set({ guideOpen: false }),
  finale: false,
  startFinale: () => set({ finale: true }),
}))
