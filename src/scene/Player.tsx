import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { clamp, damp, smoothDamp, smoothstep, type Spring } from '../lib/math'
import { emitFootstep } from '../state/footsteps'
import { useGameStore } from '../state/useGameStore'
import { clampTarget, usePlayerStore } from '../state/usePlayerStore'
import {
  BOB_LAMBDA,
  BOB_ROLL,
  BOB_RUN,
  BOB_SWAY,
  BOB_WALK,
  EYE_HEIGHT,
  GOAL_LAMBDA,
  KEY_SPEED,
  LOOK_AROUND_LAMBDA,
  LOOK_AROUND_MAX,
  LOOK_AROUND_PITCH_RATIO,
  LOOK_PITCH_DOWN,
  LOOK_PITCH_UP,
  LOOK_YAW_LIMIT,
  MAX_DT,
  MAX_SPEED,
  RECENTER_LAMBDA,
  RUN_SPEED,
  SMOOTH_TIME,
  STEP_LENGTH,
  STILL_SPEED,
  WALK_SPEED,
} from './player/tuning'
import { usePlayerInput } from './player/usePlayerInput'
import type { WalkPath } from './player/walkPath'

interface PlayerProps {
  /**
   * The walk at floor level, provided by the world. Progress is distance along it, kept
   * inside the store's `pathStart` … `pathEnd`.
   */
  path: WalkPath
}

/** Half the baseline (meters) of the finite difference used for the path tangent. */
const TANGENT_DELTA = 0.05
const TWO_PI = Math.PI * 2
/** Closer than this (meters, m/s), the walk counts as arrived and snaps to rest. */
const SETTLE_DISTANCE = 1e-4
const SETTLE_SPEED = 1e-3

// Scratch vectors: reused every frame, never allocated in the loop.
const point = new Vector3()
const ahead = new Vector3()
const behind = new Vector3()

/**
 * The first-person walker. Eases `progress` toward `targetProgress` (a soft goal, then a
 * critically damped spring, so speed and acceleration both stay smooth), puts the camera on
 * the path at eye height looking along it, adds head-bob and the drag / mouse look, and emits
 * a footstep every STEP_LENGTH meters. The world's segments join with matching tangents, so
 * the camera turns smoothly across their boundaries. Does nothing until the intro camera move
 * has finished, then takes over from exactly where it stopped. A `jumpTo` snaps instead.
 */
export default function Player({ path }: PlayerProps) {
  const canvas = useThree((s) => s.gl.domElement)
  const inputRef = usePlayerInput(canvas)
  const reducedMotion = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  const motion = useRef({
    /** First smoothing stage: eases toward the target. */
    goal: usePlayerStore.getState().progress,
    /** Second stage: the player's actual progress and velocity. */
    spring: { value: usePlayerStore.getState().progress, velocity: 0 } as Spring,
    /** Total distance walked, either way. Starts half a step in, so the first footfall comes after half a step. */
    distance: STEP_LENGTH / 2,
    lastStep: 0,
    jumps: usePlayerStore.getState().jumps,
    bobAmp: 0,
    lookYaw: 0,
    lookPitch: 0,
    aroundYaw: 0,
    aroundPitch: 0,
  })

  useFrame(({ camera }, delta) => {
    if (!useGameStore.getState().introComplete) return
    const dt = Math.min(delta, MAX_DT)
    if (dt <= 0) return
    const m = motion.current
    const input = inputRef.current
    const store = usePlayerStore.getState()
    const { pathStart, pathEnd } = store

    // A teleport (dev tools): take the new position as is, without walking there.
    if (store.jumps !== m.jumps) {
      m.jumps = store.jumps
      m.goal = store.progress
      m.spring.value = store.progress
      m.spring.velocity = 0
    }

    // --- Progress -----------------------------------------------------------------------
    const before = m.spring.value
    let target = store.targetProgress
    if (input.held !== 0) target = clampTarget(target + input.held * KEY_SPEED * dt, before, pathStart, pathEnd)
    m.goal = Math.abs(target - m.goal) < SETTLE_DISTANCE ? target : damp(m.goal, target, GOAL_LAMBDA, dt)
    smoothDamp(m.spring, m.goal, SMOOTH_TIME, MAX_SPEED, dt)
    if (Math.abs(m.goal - m.spring.value) < SETTLE_DISTANCE && Math.abs(m.spring.velocity) < SETTLE_SPEED) {
      m.spring.value = m.goal
      m.spring.velocity = 0
    }
    m.spring.value = clamp(m.spring.value, pathStart, pathEnd)
    const progress = m.spring.value
    const speed = Math.abs(m.spring.velocity)

    if (target !== store.targetProgress || progress !== store.progress || speed !== store.speed) {
      usePlayerStore.setState({ targetProgress: target, progress, speed })
    }

    // --- Footsteps ----------------------------------------------------------------------
    m.distance += Math.abs(progress - before)
    const step = Math.floor(m.distance / STEP_LENGTH)
    if (step !== m.lastStep) {
      m.lastStep = step
      emitFootstep({ foot: step % 2 === 0 ? 'left' : 'right', speed, running: speed >= RUN_SPEED, progress })
    }

    // --- Head-bob: one dip per step (lowest at the footfall), one sway per stride ---------
    const bobTarget = reducedMotion.current
      ? 0
      : BOB_WALK * smoothstep(STILL_SPEED, WALK_SPEED * 0.6, speed) +
        (BOB_RUN - BOB_WALK) * smoothstep(WALK_SPEED, MAX_SPEED, speed)
    m.bobAmp = damp(m.bobAmp, bobTarget, BOB_LAMBDA, dt)
    const phase = (m.distance / STEP_LENGTH) * TWO_PI
    const bobY = -m.bobAmp * (0.5 + 0.5 * Math.cos(phase))
    const sway = m.bobAmp * BOB_SWAY * Math.sin(phase / 2)

    // --- Look ---------------------------------------------------------------------------
    m.lookYaw = clamp(m.lookYaw + input.yawDelta, -LOOK_YAW_LIMIT, LOOK_YAW_LIMIT)
    m.lookPitch = clamp(m.lookPitch + input.pitchDelta, -LOOK_PITCH_DOWN, LOOK_PITCH_UP)
    input.yawDelta = 0
    input.pitchDelta = 0
    if (!input.dragging && speed > STILL_SPEED) {
      m.lookYaw = damp(m.lookYaw, 0, RECENTER_LAMBDA, dt)
      m.lookPitch = damp(m.lookPitch, 0, RECENTER_LAMBDA, dt)
    }
    // Look-around follows the mouse, kept inside a LOOK_AROUND_MAX circle. Held still mid-drag.
    if (!input.dragging) {
      let ax = reducedMotion.current ? 0 : input.hoverX
      let ay = reducedMotion.current ? 0 : input.hoverY * LOOK_AROUND_PITCH_RATIO
      const len = Math.hypot(ax, ay)
      if (len > 1) {
        ax /= len
        ay /= len
      }
      m.aroundYaw = damp(m.aroundYaw, -ax * LOOK_AROUND_MAX, LOOK_AROUND_LAMBDA, dt)
      m.aroundPitch = damp(m.aroundPitch, ay * LOOK_AROUND_MAX, LOOK_AROUND_LAMBDA, dt)
    }

    // --- Camera -------------------------------------------------------------------------
    path.getPointAt(progress, point)
    path.getPointAt(Math.min(progress + TANGENT_DELTA, pathEnd), ahead)
    path.getPointAt(Math.max(progress - TANGENT_DELTA, pathStart), behind)
    ahead.sub(behind)
    const flat = Math.hypot(ahead.x, ahead.z)
    const baseYaw = Math.atan2(-ahead.x, -ahead.z)
    const basePitch = Math.atan2(ahead.y, flat)

    // Sway sideways, relative to the walking direction.
    const rightX = Math.cos(baseYaw)
    const rightZ = -Math.sin(baseYaw)
    camera.position.set(point.x + rightX * sway, point.y + EYE_HEIGHT + bobY, point.z + rightZ * sway)
    camera.rotation.set(
      basePitch + m.lookPitch + m.aroundPitch,
      baseYaw + m.lookYaw + m.aroundYaw,
      -sway * BOB_ROLL,
      // Yaw, then pitch, then roll: the horizon stays level whatever the yaw.
      'YXZ',
    )
  })

  return null
}
