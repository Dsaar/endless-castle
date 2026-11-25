import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Euler, Quaternion, Vector3 } from 'three'
import { clamp, damp, smoothDamp, smoothstep, type Spring } from '../lib/math'
import { cameraFx } from '../state/cameraFx'
import { emitFootstep } from '../state/footsteps'
import { scriptedWalk } from '../state/scriptedWalk'
import { useFallStore } from '../state/useFallStore'
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
  STAIR_BOB,
  STAIR_PITCH_FOLLOW,
  STAIR_RISER,
  STAIR_SLOPE_FULL,
  STAIR_SLOPE_START,
  STEP_LENGTH,
  STILL_SPEED,
  WALK_SPEED,
} from './player/tuning'
import { usePlayerInput } from './player/usePlayerInput'
import type { WalkPath } from './player/walkPath'
import { SHAKE_MOVE, SHAKE_ROLL, SHAKE_TURN } from './shift/tuning'

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
const euler = new Euler(0, 0, 0, 'YXZ')
const baseTurn = new Quaternion()
const rollTurn = new Quaternion()
const lookTurn = new Quaternion()
const VIEW_AXIS = new Vector3(0, 0, 1)

/** Shake noise at time `t`: two unrelated sines, so it never settles into a rhythm. About ±1. */
function jolt(t: number, a: number, b: number) {
  return 0.6 * Math.sin(t * a) + 0.4 * Math.sin(t * b + 1.7)
}

/**
 * The first-person walker. Eases `progress` toward `targetProgress` (a soft goal, then a
 * critically damped spring, so speed and acceleration both stay smooth), puts the camera on
 * the path at eye height looking along it, adds head-bob and the drag / mouse look, and emits
 * a footstep every STEP_LENGTH meters. The world's segments join with matching tangents, so
 * the camera turns smoothly across their boundaries. Does nothing until the intro camera move
 * has finished, then takes over from exactly where it stopped. A `jumpTo` snaps instead.
 * Stands down while THE FALL is scripted (`FallDirector` owns the camera), and picks up again
 * at the landing with the look centered and no head-bob, where the fall left the camera.
 *
 * At a fork, `ForkDirector` may carry the player a short way (`scriptedWalk`): the quarter turn
 * into a side way, the step across to a flight. On stairs, the head-bob follows the treads (one
 * dip per riser) and the camera only half follows the slope, the way you'd look up a flight.
 *
 * `cameraFx` adds two effects. The roll (the Inverted Chamber) turns the whole body about a line
 * `rollPivot` above the path, so upside down the eye hangs below the ceiling as if standing on
 * it; the look is applied in the rolled frame, so dragging still turns the view the way you drag.
 * The shake (a room shift) jitters the eye a little; never with `prefers-reduced-motion`.
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
    stairAmp: 0,
    lookYaw: 0,
    lookPitch: 0,
    aroundYaw: 0,
    aroundPitch: 0,
    /** True while the Fall has the camera. */
    suspended: false,
  })

  useFrame(({ camera, clock }, delta) => {
    if (!useGameStore.getState().introComplete) return
    if (useFallStore.getState().phase === 'falling') {
      motion.current.suspended = true
      return
    }
    const dt = Math.min(delta, MAX_DT)
    if (dt <= 0) return
    const m = motion.current
    const input = inputRef.current
    const store = usePlayerStore.getState()
    const { pathStart, pathEnd } = store

    // Back from the Fall: it left the camera level and centered on the path, so start from rest.
    if (m.suspended) {
      m.suspended = false
      m.bobAmp = 0
      m.stairAmp = 0
      m.lookYaw = 0
      m.lookPitch = 0
      m.aroundYaw = 0
      m.aroundPitch = 0
    }

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
    if (scriptedWalk.active) {
      // Carried along: take the scripted position as is, and its rate of change as the speed.
      target = scriptedWalk.progress
      m.goal = target
      m.spring.velocity = (target - before) / dt
      m.spring.value = target
    } else {
      if (input.held !== 0) target = clampTarget(target + input.held * KEY_SPEED * dt, before, pathStart, pathEnd)
      m.goal = Math.abs(target - m.goal) < SETTLE_DISTANCE ? target : damp(m.goal, target, GOAL_LAMBDA, dt)
      smoothDamp(m.spring, m.goal, SMOOTH_TIME, MAX_SPEED, dt)
      if (Math.abs(m.goal - m.spring.value) < SETTLE_DISTANCE && Math.abs(m.spring.velocity) < SETTLE_SPEED) {
        m.spring.value = m.goal
        m.spring.velocity = 0
      }
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

    // --- Where the path is, and which way it runs ----------------------------------------
    path.getPointAt(progress, point)
    path.getPointAt(Math.min(progress + TANGENT_DELTA, pathEnd), ahead)
    path.getPointAt(Math.max(progress - TANGENT_DELTA, pathStart), behind)
    ahead.sub(behind)
    const flat = Math.hypot(ahead.x, ahead.z)
    const baseYaw = Math.atan2(-ahead.x, -ahead.z)
    // 0 on the level and gentle arches, 1 on a flight of stairs.
    const stairs = smoothstep(STAIR_SLOPE_START, STAIR_SLOPE_FULL, flat > 1e-6 ? Math.abs(ahead.y) / flat : 0)
    const basePitch = Math.atan2(ahead.y, flat) * (1 - stairs * (1 - STAIR_PITCH_FOLLOW))

    // --- Head-bob: one dip per step (lowest at the footfall), one sway per stride ---------
    // On stairs, one dip per riser instead, lowest in the middle of each tread.
    const moving = smoothstep(STILL_SPEED, WALK_SPEED * 0.6, speed)
    const bobTarget = reducedMotion.current
      ? 0
      : BOB_WALK * moving + (BOB_RUN - BOB_WALK) * smoothstep(WALK_SPEED, MAX_SPEED, speed)
    m.bobAmp = damp(m.bobAmp, bobTarget, BOB_LAMBDA, dt)
    m.stairAmp = damp(m.stairAmp, reducedMotion.current ? 0 : STAIR_BOB * moving, BOB_LAMBDA, dt)
    const phase = (m.distance / STEP_LENGTH) * TWO_PI
    const walkBob = -m.bobAmp * (0.5 + 0.5 * Math.cos(phase))
    const tread = ((point.y - (path.baseHeightAt?.(progress) ?? 0)) / STAIR_RISER) * TWO_PI
    const stairBob = -m.stairAmp * (0.5 + 0.5 * Math.cos(tread))
    const bobY = walkBob + (stairBob - walkBob) * stairs
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
    // The eye, across (sway) and up from the path, then turned with the roll about the pivot line.
    let eyeAcross = sway
    let eyeUp = EYE_HEIGHT + bobY
    const roll = cameraFx.roll
    if (roll !== 0) {
      const c = Math.cos(roll)
      const s = Math.sin(roll)
      const pivot = cameraFx.rollPivot
      const across = eyeAcross
      const up = eyeUp - pivot
      eyeAcross = across * c - up * s
      eyeUp = pivot + across * s + up * c
    }
    const shake = reducedMotion.current ? 0 : cameraFx.shake
    const t = clock.elapsedTime
    if (shake > 0) {
      eyeAcross += SHAKE_MOVE * shake * jolt(t, 31, 47)
      eyeUp += SHAKE_MOVE * shake * jolt(t, 37, 53)
    }
    // Sideways is relative to the walking direction.
    const rightX = Math.cos(baseYaw)
    const rightZ = -Math.sin(baseYaw)
    camera.position.set(point.x + rightX * eyeAcross, point.y + eyeUp, point.z + rightZ * eyeAcross)

    const lookPitch = m.lookPitch + m.aroundPitch + SHAKE_TURN * shake * jolt(t, 29, 43)
    const lookYaw = m.lookYaw + m.aroundYaw + SHAKE_TURN * shake * jolt(t, 23, 41)
    const headRoll = -sway * BOB_ROLL + SHAKE_ROLL * shake * jolt(t, 19, 59)
    if (roll === 0) {
      // Yaw, then pitch, then roll: the horizon stays level whatever the yaw.
      camera.rotation.set(basePitch + lookPitch, baseYaw + lookYaw, headRoll, 'YXZ')
    } else {
      // Along the path, then rolled about the view, then the look in the rolled frame.
      baseTurn.setFromEuler(euler.set(basePitch, baseYaw, 0, 'YXZ'))
      rollTurn.setFromAxisAngle(VIEW_AXIS, roll)
      lookTurn.setFromEuler(euler.set(lookPitch, lookYaw, headRoll, 'YXZ'))
      camera.quaternion.copy(baseTurn).multiply(rollTurn).multiply(lookTurn)
    }
  })

  return null
}
