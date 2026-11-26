import { useEffect, useRef } from 'react'
import { useFrame, type RootState } from '@react-three/fiber'
import gsap from 'gsap'
import { Vector3 } from 'three'
import { damp } from '../../lib/math'
import { emitSign } from '../../state/signs'
import { useFallStore } from '../../state/useFallStore'
import { useFigureStore } from '../../state/useFigureStore'
import { useGameStore } from '../../state/useGameStore'
import { getLiveFigures } from '../figures/liveFigures'
import { presenceFx } from './presenceFx'
import {
  HEARTBEAT_BPM_FAR,
  HEARTBEAT_BPM_NEAR,
  HEARTBEAT_DECAY,
  HEARTBEAT_DUB_DELAY,
  HEARTBEAT_DUB_SHARE,
  PRESENCE_FALL,
  PRESENCE_FLOOR,
  PRESENCE_NEAR,
  PRESENCE_ON,
  PRESENCE_RANGE,
  PRESENCE_RANGE_HYSTERESIS,
  PRESENCE_RESET,
  PRESENCE_RISE,
  RIPPLE_DURATION,
  RIPPLE_EVERY_FAR,
  RIPPLE_EVERY_NEAR,
  RIPPLE_JITTER,
  RIPPLE_MIN,
  RIPPLE_OFFSCREEN,
  RIPPLE_REACH,
} from './tuning'

const position = new Vector3()
const nearest = new Vector3()
const view = new Vector3()

/** Strength for a figure `distance` meters away: FLOOR at the edge of the range, 1 at PRESENCE_NEAR. */
function strengthAt(distance: number) {
  const t = (PRESENCE_RANGE - distance) / (PRESENCE_RANGE - PRESENCE_NEAR)
  return PRESENCE_FLOOR + (1 - PRESENCE_FLOOR) * Math.min(1, Math.max(0, t))
}

/** Seconds until the next ripple, at presence `level`. */
function rippleWait(level: number) {
  const k = Math.min(1, Math.max(0, (level - RIPPLE_MIN) / (1 - RIPPLE_MIN)))
  return RIPPLE_EVERY_FAR + (RIPPLE_EVERY_NEAR - RIPPLE_EVERY_FAR) * k + (Math.random() * 2 - 1) * RIPPLE_JITTER
}

/**
 * Where a ripple from `target` starts, in screen UV (written into presenceFx): on the figure
 * if it is in view, otherwise off the edge on its side, so the ripple rolls in from where it is.
 */
function aimRipple(camera: RootState['camera'], target: Vector3 | null) {
  // Forced from the dev panel with no figure near: roll in from the right.
  let x = RIPPLE_OFFSCREEN
  let y = 0
  if (target) {
    view.copy(target).applyMatrix4(camera.matrixWorldInverse)
    const behind = view.z > -0.1
    // In front: where it is on screen (NDC). Behind: only which side it is on matters.
    if (!behind) view.copy(target).project(camera)
    const r = Math.hypot(view.x, view.y)
    if (!behind && r <= RIPPLE_OFFSCREEN) {
      x = view.x
      y = view.y
    } else if (r > 1e-4) {
      x = (view.x / r) * RIPPLE_OFFSCREEN
      y = (view.y / r) * RIPPLE_OFFSCREEN
    }
  }
  presenceFx.rippleX = 0.5 + 0.5 * x
  presenceFx.rippleY = 0.5 + 0.5 * y
}

/**
 * PRESENCE: within PRESENCE_RANGE of a figure not yet found, the castle grows uneasy. The
 * strength ramps up over a few seconds and grows as you get closer (walls don't stop it: it is
 * felt, not seen). `PostEffects` turns it into a darker vignette, less color, and a slow wave
 * and color split at the screen's rim. A heartbeat runs under it, faster the closer you are,
 * and every few seconds a dark ripple (GSAP) rolls across the view from the figure's side.
 * Finding the figure resets it at once.
 *
 * Writes `presenceFx` and emits `presence`, `heartbeat` and `ripple` signs. Off in the intro,
 * the Fall and the finale; held as it is while the guide is open. No allocations per frame.
 */
export default function PresenceDirector() {
  const state = useRef({
    /** Heartbeat phase, 0 … 1: a beat when it wraps. */
    beat: 0,
    sinceBeat: Infinity,
    /** Seconds until the next ripple. */
    rippleIn: 0,
    present: false,
    /** The figure being felt (or last felt, while the presence fades), or −1. */
    figure: -1,
    /** Its figure was just found: the presence is dropping away fast. */
    resetting: false,
  })
  const ripple = useRef<gsap.core.Timeline | null>(null)

  useEffect(
    () => () => {
      ripple.current?.kill()
      ripple.current = null
    },
    [],
  )

  /** Ends the ripple on screen (quickly, for a found figure). */
  const stopRipple = (fade: number) => {
    ripple.current?.kill()
    ripple.current = fade > 0 ? gsap.timeline().to(presenceFx, { rippleStrength: 0, duration: fade, ease: 'power1.out' }) : null
    if (fade <= 0) presenceFx.rippleStrength = 0
  }

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.1)
    const s = state.current
    const game = useGameStore.getState()
    if (game.guideOpen) return
    const active = game.introComplete && !game.finale && useFallStore.getState().phase !== 'falling'

    // The nearest figure not found yet, within range.
    const found = useFigureStore.getState().found
    const range = PRESENCE_RANGE + (s.present ? PRESENCE_RANGE_HYSTERESIS : 0)
    let figure = -1
    let distance = Infinity
    if (active) {
      for (const live of getLiveFigures()) {
        if (found[live.index]) continue
        live.anchor.getWorldPosition(position)
        const d = position.distanceTo(camera.position)
        if (d < distance) {
          distance = d
          figure = live.index
          nearest.copy(position)
        }
      }
    }
    if (distance > range) {
      figure = -1
      distance = Infinity
    }

    // The figure being felt has just been found: let go at once (even if another one is near,
    // the presence drops away before it can begin again).
    if (s.figure >= 0 && found[s.figure]) {
      if (s.present) emitSign({ kind: 'presence', state: 'end', reason: 'found', figure: s.figure, distance: presenceFx.distance })
      s.present = false
      s.figure = -1
      s.resetting = true
      stopRipple(0.35)
    }
    if (s.resetting && presenceFx.level <= PRESENCE_ON) s.resetting = false

    const forced = presenceFx.forced >= 0 && active
    const target = s.resetting ? 0 : forced ? presenceFx.forced : figure >= 0 ? strengthAt(distance) : 0
    const rate = s.resetting ? PRESENCE_RESET : target > presenceFx.level ? PRESENCE_RISE : PRESENCE_FALL
    presenceFx.level = damp(presenceFx.level, target, rate, dt)
    if (target === 0 && presenceFx.level < 1e-3) presenceFx.level = 0
    if (figure >= 0 && !s.resetting) s.figure = figure
    presenceFx.figure = s.figure
    presenceFx.distance = distance
    const level = presenceFx.level

    // Begins and ends.
    if (!s.present && !s.resetting && level > PRESENCE_ON && (figure >= 0 || forced)) {
      s.present = true
      s.beat = 0.6 // the first beat comes soon after it begins
      s.rippleIn = rippleWait(Math.max(level, RIPPLE_MIN)) * 0.5
      emitSign({ kind: 'presence', state: 'begin', figure, distance })
    } else if (s.present && level <= PRESENCE_ON) {
      emitSign({ kind: 'presence', state: 'end', reason: 'away', figure: s.figure, distance })
      s.present = false
      s.figure = -1
    }

    // The heartbeat: lub, then dub, at a rate that rises with the presence.
    if (s.present) {
      presenceFx.bpm = HEARTBEAT_BPM_FAR + (HEARTBEAT_BPM_NEAR - HEARTBEAT_BPM_FAR) * level
      s.beat += (dt * presenceFx.bpm) / 60
      if (s.beat >= 1) {
        s.beat -= Math.floor(s.beat)
        s.sinceBeat = 0
        emitSign({ kind: 'heartbeat', bpm: presenceFx.bpm, level, figure: presenceFx.figure })
      }
    } else {
      presenceFx.bpm = 0
    }
    s.sinceBeat += dt
    const lub = Math.exp(-s.sinceBeat * HEARTBEAT_DECAY)
    const late = s.sinceBeat - HEARTBEAT_DUB_DELAY
    const dub = late > 0 ? HEARTBEAT_DUB_SHARE * Math.exp(-late * HEARTBEAT_DECAY) : 0
    presenceFx.pulse = (lub + dub) * level

    // The ripple: every few seconds while the presence is strong enough (or on request).
    const requested = presenceFx.rippleRequested
    presenceFx.rippleRequested = false
    if (s.present && level >= RIPPLE_MIN) s.rippleIn -= dt
    if (!requested && !(s.present && level >= RIPPLE_MIN && s.rippleIn <= 0)) return
    s.rippleIn = rippleWait(level)
    const strength = requested ? Math.max(level, 0.8) : level
    aimRipple(camera, figure >= 0 ? nearest : null)
    ripple.current?.kill()
    presenceFx.rippleRadius = 0
    presenceFx.rippleStrength = 0
    ripple.current = gsap
      .timeline()
      .to(presenceFx, { rippleRadius: RIPPLE_REACH, duration: RIPPLE_DURATION, ease: 'none' }, 0)
      .to(presenceFx, { rippleStrength: strength, duration: RIPPLE_DURATION * 0.15, ease: 'power1.out' }, 0)
      .to(presenceFx, { rippleStrength: 0, duration: RIPPLE_DURATION * 0.5, ease: 'power1.in' }, RIPPLE_DURATION * 0.5)
    emitSign({ kind: 'ripple', level: strength, figure: presenceFx.figure, duration: RIPPLE_DURATION })
  })

  return null
}
