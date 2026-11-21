import { useEffect } from 'react'
import { usePlayerStore } from '../state/usePlayerStore'

/**
 * Calls `onTrigger` once, the first time the player's progress reaches `distance`.
 * If it is already there on mount (a segment remounted behind a player walking back),
 * it fires straight away with `immediate` true, so animations can snap to their end.
 * Pass a stable callback (useCallback), or it re-arms on every render.
 */
export function useProgressTrigger(distance: number, onTrigger: (immediate: boolean) => void) {
  useEffect(() => {
    if (usePlayerStore.getState().progress >= distance) {
      onTrigger(true)
      return
    }
    const unsubscribe = usePlayerStore.subscribe((s) => {
      if (s.progress < distance) return
      unsubscribe()
      onTrigger(false)
    })
    return unsubscribe
  }, [distance, onTrigger])
}
