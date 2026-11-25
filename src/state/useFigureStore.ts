import { create } from 'zustand'
import { FIGURES } from '../world/figures'

/** How many hidden figures the castle holds. */
export const FIGURE_COUNT = FIGURES.length

/** Seconds the FOUND card stays up before it fades. */
export const CARD_DURATION = 4.5

/** Where progress is saved: the ids of the figures found so far, as JSON. */
const STORAGE_KEY = 'endless-castle/found'

/** The FOUND card on screen. `n` is unique per showing, so showing the same card again fades it in again. */
export interface FoundCard {
  /** Index into FIGURES. */
  index: number
  n: number
}

/**
 * Which of the six hidden figures the player has found, by slot (index into FIGURES, which is
 * the figure's number minus one), saved in localStorage. Also the FOUND card, and how many of
 * each figure's lines have been said. Changes only on those events, so it is safe to subscribe to.
 */
interface FigureState {
  found: readonly boolean[]
  card: FoundCard | null
  /** Lines said so far by each figure, so the next click says the next one. In memory only. */
  spoken: readonly number[]
  /** Marks figure `index` found and saves. Returns false if it already was. */
  markFound: (index: number) => boolean
  /** Forgets every figure found, saved progress included. */
  resetFound: () => void
  /** Re-reads saved progress (a new visit from the title screen). */
  load: () => void
  /** Clears saved progress but leaves this visit's as it is (the finale: the next visit starts afresh). */
  forgetSaved: () => void
  /** Shows figure `index`'s card for CARD_DURATION seconds, replacing any card up. */
  showCard: (index: number) => void
  hideCard: () => void
  /** The line figure `index` should say next; counts it as said. */
  nextLine: (index: number) => number
}

const none = () => FIGURES.map(() => false)
const zeros = () => FIGURES.map(() => 0)

/** Saved progress, or nothing found if there is none (or storage is unavailable). */
function loadFound(): boolean[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const ids: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(ids)) return none()
    return FIGURES.map((f) => ids.includes(f.id))
  } catch {
    return none()
  }
}

function saveFound(found: readonly boolean[]) {
  try {
    const ids = FIGURES.filter((_, i) => found[i]).map((f) => f.id)
    if (ids.length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Private mode or storage full: progress just isn't kept.
  }
}

let cards = 0
let hideTimer: ReturnType<typeof setTimeout> | undefined

export const useFigureStore = create<FigureState>()((set, get) => ({
  found: loadFound(),
  card: null,
  spoken: zeros(),
  markFound: (index) => {
    const { found } = get()
    if (found[index] || index < 0 || index >= FIGURE_COUNT) return false
    const next = found.map((f, i) => f || i === index)
    saveFound(next)
    set({ found: next })
    return true
  },
  resetFound: () => {
    saveFound(none())
    set({ found: none(), spoken: zeros() })
  },
  load: () => set({ found: loadFound(), spoken: zeros(), card: null }),
  forgetSaved: () => saveFound(none()),
  showCard: (index) => {
    clearTimeout(hideTimer)
    const n = ++cards
    set({ card: { index, n } })
    hideTimer = setTimeout(() => set((s) => (s.card?.n === n ? { card: null } : s)), CARD_DURATION * 1000)
  },
  hideCard: () => {
    clearTimeout(hideTimer)
    set({ card: null })
  },
  nextLine: (index) => {
    const { spoken } = get()
    const line = spoken[index] % FIGURES[index].lines.length
    set({ spoken: spoken.map((n, i) => (i === index ? n + 1 : n)) })
    return line
  },
}))

/** True when every figure has been found. */
export function allFound(found: readonly boolean[]) {
  return found.every(Boolean)
}
