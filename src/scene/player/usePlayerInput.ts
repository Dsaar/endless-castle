import { useEffect, useRef, type RefObject } from 'react'
import { scriptedWalk } from '../../state/scriptedWalk'
import { useFallStore } from '../../state/useFallStore'
import { useGameStore } from '../../state/useGameStore'
import { usePlayerStore } from '../../state/usePlayerStore'
import {
  MOUSE_LOOK_PER_PIXEL,
  STRIDE,
  TOUCH_FLING_SECONDS,
  TOUCH_LOOK_PER_PIXEL,
  TOUCH_METERS_PER_PIXEL,
  TOUCH_SLOP,
  WHEEL_METERS_PER_PIXEL,
} from './tuning'

/**
 * What the input wants this frame. `Player` reads it in `useFrame` and consumes the look
 * deltas. Walking input that is a one-off (wheel, swipe, Space) goes straight to the store.
 */
export interface PlayerInput {
  /** +1 while a forward key is held, -1 for a back key, 0 for neither or both. */
  held: number
  /** Drag look accumulated since the last frame (radians). `Player` zeroes these. */
  yawDelta: number
  pitchDelta: number
  /** True while a mouse or finger is dragging the view. */
  dragging: boolean
  /** Mouse position over the window, -1..1 (up is +1). 0, 0 when unknown or off-window. */
  hoverX: number
  hoverY: number
}

const FORWARD_KEYS = new Set(['KeyW', 'ArrowUp'])
const BACK_KEYS = new Set(['KeyS', 'ArrowDown'])

type Gesture = 'pending' | 'walk' | 'look'

interface TouchPoint {
  x: number
  y: number
}

/** Wheel deltas come in pixels, lines or pages. */
function wheelPixels(e: WheelEvent) {
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) return e.deltaY * 16
  if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) return e.deltaY * window.innerHeight
  return e.deltaY
}

export function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/**
 * Can the player act? Not until the intro camera has arrived, not while the guide is open,
 * not during THE FALL (nothing may slow it or steer it), not while a fork carries them
 * into the way they chose, and not once the finale has begun.
 */
function canMove() {
  const game = useGameStore.getState()
  return (
    game.introComplete &&
    !game.guideOpen &&
    !game.finale &&
    useFallStore.getState().phase !== 'falling' &&
    !scriptedWalk.active
  )
}

/**
 * The first attempt to walk at the gate opens the guide instead (and is swallowed).
 * Returns whether this walk should go ahead.
 */
function allowWalk() {
  const game = useGameStore.getState()
  if (game.guideSeen) return true
  game.openGuide()
  return false
}

/**
 * DOM input for walking and looking.
 * - Wheel, W/S, ↑/↓, Space and Shift+Space walk (on `element` and the window).
 * - Mouse drag on `element` looks around; a touch swipe walks (vertical) or looks (horizontal),
 *   and a two-finger drag always looks.
 * - On devices with a fine hover pointer, the mouse position feeds a subtle look-around.
 * - The first walk opens the guide. While it is open, everything here is ignored, held keys
 *   are released and drags are dropped. The same goes for the whole of THE FALL.
 */
export function usePlayerInput(element: HTMLElement): RefObject<PlayerInput> {
  // One mutable object for the lifetime of the component, read by Player's frame loop.
  const input = useRef<PlayerInput>({ held: 0, yawDelta: 0, pitchDelta: 0, dragging: false, hoverX: 0, hoverY: 0 })

  useEffect(() => {
    const state = input.current
    const walkBy = (meters: number) => usePlayerStore.getState().walkBy(meters)
    const hoverPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches

    // --- Keys ---------------------------------------------------------------------------
    const pressed = new Set<string>()
    const updateHeld = () => {
      let fwd = false
      let back = false
      for (const code of pressed) {
        if (FORWARD_KEYS.has(code)) fwd = true
        else if (BACK_KEYS.has(code)) back = true
      }
      state.held = (fwd ? 1 : 0) - (back ? 1 : 0)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      // While the guide is open, keys belong to it (Space and arrows work its buttons and tabs).
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target) || useGameStore.getState().guideOpen) return
      if (FORWARD_KEYS.has(e.code) || BACK_KEYS.has(e.code)) {
        e.preventDefault()
        if (!canMove() || (!pressed.has(e.code) && !allowWalk())) return
        pressed.add(e.code)
        updateHeld()
      } else if (e.code === 'Space') {
        e.preventDefault()
        // One stride per press; holding Space doesn't auto-repeat.
        if (e.repeat || !canMove() || !allowWalk()) return
        walkBy(e.shiftKey ? -STRIDE : STRIDE)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (pressed.delete(e.code)) updateHeld()
    }
    const releaseKeys = () => {
      pressed.clear()
      updateHeld()
    }

    // --- Wheel --------------------------------------------------------------------------
    const onWheel = (e: WheelEvent) => {
      // Also blocks the browser's overscroll and swipe-back gestures.
      e.preventDefault()
      if (e.ctrlKey || !canMove() || !allowWalk()) return // ctrl+wheel is a trackpad pinch
      walkBy(wheelPixels(e) * WHEEL_METERS_PER_PIXEL)
    }

    // --- Mouse / touch drag -------------------------------------------------------------
    const touches = new Map<number, TouchPoint>()
    let gesture: Gesture = 'pending'
    let mouseId = -1
    let lastX = 0
    let lastY = 0
    let startX = 0
    let startY = 0
    /** Smoothed vertical swipe speed (px/s), for the fling on release. */
    let swipeVelocity = 0
    let lastMoveTime = 0

    const touchCenter = () => {
      let x = 0
      let y = 0
      for (const p of touches.values()) {
        x += p.x
        y += p.y
      }
      return { x: x / touches.size, y: y / touches.size }
    }

    const look = (dx: number, dy: number, perPixel: number) => {
      // Grab the world: dragging right turns the view left, dragging down tilts it up.
      state.yawDelta += dx * perPixel
      state.pitchDelta += dy * perPixel
    }

    const onPointerDown = (e: PointerEvent) => {
      if (!canMove()) return
      if (e.pointerType === 'mouse') {
        if (e.button !== 0) return
        mouseId = e.pointerId
        lastX = e.clientX
        lastY = e.clientY
        state.dragging = true
      } else {
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
        const c = touchCenter()
        lastX = startX = c.x
        lastY = startY = c.y
        // A second finger always means look.
        gesture = touches.size > 1 ? 'look' : 'pending'
        swipeVelocity = 0
        lastMoveTime = e.timeStamp
        state.dragging = gesture === 'look'
      }
      element.setPointerCapture(e.pointerId)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        if (e.pointerId !== mouseId) return
        look(e.clientX - lastX, e.clientY - lastY, MOUSE_LOOK_PER_PIXEL)
        lastX = e.clientX
        lastY = e.clientY
        return
      }
      const point = touches.get(e.pointerId)
      if (!point) return
      point.x = e.clientX
      point.y = e.clientY
      const c = touchCenter()
      const dx = c.x - lastX
      const dy = c.y - lastY
      lastX = c.x
      lastY = c.y

      if (gesture === 'pending') {
        const ox = c.x - startX
        const oy = c.y - startY
        if (Math.hypot(ox, oy) < TOUCH_SLOP) return
        gesture = Math.abs(oy) > Math.abs(ox) ? 'walk' : 'look'
        state.dragging = gesture === 'look'
        // The first swipe to walk opens the guide, which cancels this gesture (see below).
        if (gesture === 'walk' && !allowWalk()) return
      }

      if (gesture === 'look') {
        look(dx, dy, TOUCH_LOOK_PER_PIXEL)
      } else {
        // Swipe up (finger moves up the screen) walks forward, like scrolling down.
        walkBy(-dy * TOUCH_METERS_PER_PIXEL)
        const dt = Math.max(1, e.timeStamp - lastMoveTime) / 1000
        swipeVelocity = swipeVelocity * 0.6 + (dy / dt) * 0.4
        lastMoveTime = e.timeStamp
      }
    }

    const onPointerEnd = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        if (e.pointerId !== mouseId) return
        mouseId = -1
        state.dragging = false
        return
      }
      if (!touches.delete(e.pointerId)) return
      if (touches.size > 0) {
        // Re-anchor on the remaining fingers so the center doesn't jump.
        const c = touchCenter()
        lastX = c.x
        lastY = c.y
        return
      }
      // A quick flick keeps walking a little; a swipe that stopped before lifting doesn't.
      const stale = e.timeStamp - lastMoveTime > 80
      if (gesture === 'walk' && !stale) walkBy(-swipeVelocity * TOUCH_FLING_SECONDS * TOUCH_METERS_PER_PIXEL)
      gesture = 'pending'
      state.dragging = false
    }

    // --- Mouse position look-around (desktop) -------------------------------------------
    const onHover = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || useGameStore.getState().guideOpen) return
      state.hoverX = (e.clientX / window.innerWidth) * 2 - 1
      state.hoverY = 1 - (e.clientY / window.innerHeight) * 2
    }
    const onHoverLeave = () => {
      state.hoverX = 0
      state.hoverY = 0
    }

    const onBlur = () => {
      releaseKeys()
      onHoverLeave()
    }

    // When the guide opens, the Fall or the finale begins, let go of everything: keys, drags, swipes and the look-around.
    const dropAll = () => {
      onBlur()
      touches.clear()
      mouseId = -1
      gesture = 'pending'
      state.dragging = false
      state.yawDelta = 0
      state.pitchDelta = 0
    }
    const unsubscribeGuide = useGameStore.subscribe((s, prev) => {
      if ((s.guideOpen && !prev.guideOpen) || (s.finale && !prev.finale)) dropAll()
    })
    const unsubscribeFall = useFallStore.subscribe((s, prev) => {
      if (s.phase === 'falling' && prev.phase !== 'falling') dropAll()
    })

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    element.addEventListener('wheel', onWheel, { passive: false })
    element.addEventListener('pointerdown', onPointerDown)
    element.addEventListener('pointermove', onPointerMove)
    element.addEventListener('pointerup', onPointerEnd)
    element.addEventListener('pointercancel', onPointerEnd)
    if (hoverPointer) {
      window.addEventListener('pointermove', onHover)
      document.documentElement.addEventListener('pointerleave', onHoverLeave)
    }

    return () => {
      unsubscribeGuide()
      unsubscribeFall()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      element.removeEventListener('wheel', onWheel)
      element.removeEventListener('pointerdown', onPointerDown)
      element.removeEventListener('pointermove', onPointerMove)
      element.removeEventListener('pointerup', onPointerEnd)
      element.removeEventListener('pointercancel', onPointerEnd)
      window.removeEventListener('pointermove', onHover)
      document.documentElement.removeEventListener('pointerleave', onHoverLeave)
      Object.assign(state, { held: 0, yawDelta: 0, pitchDelta: 0, dragging: false, hoverX: 0, hoverY: 0 })
    }
  }, [element])

  return input
}
