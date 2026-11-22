import { create } from 'zustand'

/** Seconds a subtitle stays up when no duration is given. */
export const DEFAULT_SUBTITLE_DURATION = 4

export interface Subtitle {
  /** Unique per call, so showing the same line twice still fades it in again. */
  id: number
  en: string
  /** The Japanese line under the English one. May be empty. */
  ja: string
  /** Seconds on screen before it starts to fade out. */
  duration: number
}

interface SubtitleState {
  /** The line on screen, or null when there is none. */
  current: Subtitle | null
  /** Show a line in the HUD's subtitle area. It replaces any line already up (crossfading). */
  showSubtitle: (en: string, ja?: string, duration?: number) => void
  clearSubtitle: () => void
}

let nextId = 1
let hideTimer: ReturnType<typeof setTimeout> | undefined

export const useSubtitleStore = create<SubtitleState>()((set) => ({
  current: null,
  showSubtitle: (en, ja = '', duration = DEFAULT_SUBTITLE_DURATION) => {
    clearTimeout(hideTimer)
    const id = nextId++
    set({ current: { id, en, ja, duration } })
    hideTimer = setTimeout(() => set((s) => (s.current?.id === id ? { current: null } : s)), duration * 1000)
  },
  clearSubtitle: () => {
    clearTimeout(hideTimer)
    set({ current: null })
  },
}))
