import { useEffect } from 'react'
import { useForkStore } from '../../state/useForkStore'
import { useGameStore } from '../../state/useGameStore'
import type { BranchChoice } from '../../world/segment'
import { isTyping } from '../player/usePlayerInput'
import { WHEEL_GESTURE_GAP, WHEEL_STRAIGHT_PIXELS } from './tuning'

/** In a hall: A / ← left, D / → right, W / ↑ / Space straight on. */
const TURN_KEYS: Readonly<Record<string, BranchChoice>> = {
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  KeyW: 'straight',
  ArrowUp: 'straight',
  Space: 'straight',
}
/** On the stairs: E rises, Q descends. */
const STAIR_KEYS: Readonly<Record<string, BranchChoice>> = { KeyE: 'up', KeyQ: 'down' }

/** Wheel deltas come in pixels, lines or pages. */
function wheelPixels(e: WheelEvent) {
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) return e.deltaY * 16
  if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) return e.deltaY * window.innerHeight
  return e.deltaY
}

/**
 * Keys and scroll that choose a way at the fork the player is waiting at. Only fresh presses
 * count (a key held down on the way in doesn't), and only a scroll begun after arriving goes
 * straight on. Touch and mouse use the HUD's buttons. Asks `useForkStore.choose`, which
 * ignores ways the fork doesn't offer.
 */
export function useForkInput() {
  useEffect(() => {
    let arrivedAt = Number.NEGATIVE_INFINITY
    let lastWheel = Number.NEGATIVE_INFINITY
    let gestureStart = Number.NEGATIVE_INFINITY
    let pushed = 0

    const unsubscribe = useForkStore.subscribe((s, prev) => {
      if (s.waiting && s.waiting !== prev.waiting) arrivedAt = performance.now()
    })
    const ready = () => {
      const game = useGameStore.getState()
      return game.introComplete && !game.guideOpen
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target) || !ready()) return
      const waiting = useForkStore.getState().waiting
      if (!waiting) return
      const choice = (waiting.picker === 'turn' ? TURN_KEYS : STAIR_KEYS)[e.code]
      if (choice) useForkStore.getState().choose(choice)
    }

    const onWheel = (e: WheelEvent) => {
      if (e.timeStamp - lastWheel > WHEEL_GESTURE_GAP) {
        gestureStart = e.timeStamp
        pushed = 0
      }
      lastWheel = e.timeStamp
      const waiting = useForkStore.getState().waiting
      if (!waiting || waiting.picker !== 'turn' || e.ctrlKey || !ready() || gestureStart < arrivedAt) return
      pushed += Math.max(0, wheelPixels(e))
      if (pushed >= WHEEL_STRAIGHT_PIXELS) useForkStore.getState().choose('straight')
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      unsubscribe()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('wheel', onWheel)
    }
  }, [])
}
