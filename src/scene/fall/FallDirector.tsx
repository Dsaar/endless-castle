import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { Euler, FogExp2, Vector3, type PerspectiveCamera, type Scene } from 'three'
import { useAtmosphereStore } from '../../state/useAtmosphereStore'
import { useFallStore } from '../../state/useFallStore'
import { usePlayerStore } from '../../state/usePlayerStore'
import type { Segment } from '../../world/segment'
import { FALL_DROP, FALL_FORWARD } from '../../world/segments/fall/layout'
import {
  FALL_ACCEL,
  FALL_BRAKE,
  FALL_END,
  FALL_START,
  FLOOR_GIVES,
  LANDING,
  STUMBLE_TIME,
  fallStandZ,
} from '../../world/segments/fall/timing'
import { FALL_SEGMENT_ID, type WorldGenerator } from '../../world/WorldGenerator'
import { addLightSources, type LightSource } from '../lighting/lightSources'
import { EYE_HEIGHT, MAX_DT } from '../player/tuning'
import { fallFx, fallIntensity } from './fallFx'
import {
  CARRIED_LIGHT_AHEAD,
  CARRIED_LIGHT_DECK,
  CARRIED_LIGHT_DISTANCE,
  CARRIED_LIGHT_INTENSITY,
  DECK_LOOK_PITCH,
  DECK_SAG,
  DRIFT_TIME,
  FALL_FOG_SCALE,
  FALL_PITCH,
  FOV_KICK,
  LAND_DIP,
  LAND_NOD,
  LEVEL_TIME,
  PITCH_DOWN_TIME,
  TAKEOVER_SNAP,
  WOBBLE_PITCH,
  WOBBLE_ROLL,
} from './tuning'

/** The camera, in the Fall segment's frame (yaw relative to it), as GSAP tweens it. */
interface Pose {
  x: number
  y: number
  z: number
  yaw: number
  pitch: number
  roll: number
  /** Landing: knees bending (meters) and the head nodding (radians). */
  dip: number
  nod: number
  /** Falling speed, 0 … 1 of the top speed (drives the speed effects). */
  speed: number
  /** The carried light's level, 0 … 1. */
  light: number
}

interface Run {
  fall: Segment
  pose: Pose
  timeline: gsap.core.Timeline
  light: LightSource
  removeLight: () => void
  baseFov: number
  /** Seconds since the fall started, for the wobble. */
  time: number
}

const TWO_PI = Math.PI * 2
const scratch = new Vector3()
const euler = new Euler(0, 0, 0, 'YXZ')

function wrapAngle(a: number) {
  return a - TWO_PI * Math.round(a / TWO_PI)
}

/** Thins the scene fog by `scale` of the dev-tunable density (1 restores it). */
function scaleFog(scene: Scene, scale: number) {
  if (scene.fog instanceof FogExp2) scene.fog.density = useAtmosphereStore.getState().fogDensity * scale
}

/**
 * THE FALL: the scripted drop from the first Threshold to the Suspended Walkway far below.
 *
 * When the player steps onto the Fall's deck it locks input (`useFallStore` → `falling`), and
 * the HUD reads THE FALL. The planks ahead split and drop away (the deck runs that part), the
 * camera stumbles, looks down, the floor gives, and it pitches 70° down and falls, accelerating,
 * for about 6 s past the shaft's pillars, rooms, stairs and towers. Speed widens the field of
 * view, deepens the vignette, thins the fog, streaks embers upward and wobbles the roll. Near the bottom it
 * slows, levels out and lands softly at the walkway's start; then the way back up is sealed,
 * the player is placed there and input unlocks. Scrolling and keys do nothing meanwhile.
 *
 * Mount after `Player`. Its frame callback runs before everything else's, so the light pool,
 * the motes and the streaks see this frame's camera.
 */
export default function FallDirector({ generator }: { generator: WorldGenerator }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const scene = useThree((s) => s.scene)
  const run = useRef<Run | null>(null)
  const reduced = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const fall = generator.byId(FALL_SEGMENT_ID)
    if (!fall || fall.kind !== 'fall') return
    const start = fall.start
    const landAt = fall.startDistance + fall.length

    const seal = () => {
      generator.path.sealBefore(landAt)
      usePlayerStore.getState().setPathBounds(generator.path.start, generator.path.end)
    }

    const finish = () => {
      const r = run.current
      run.current = null
      if (r) {
        r.timeline.kill()
        r.removeLight()
        camera.fov = r.baseFov
        camera.updateProjectionMatrix()
      }
      scaleFog(scene, 1)
      fallFx.speed = 0
      // Still `falling` while these land, so `check` ignores them; then unlock.
      seal()
      usePlayerStore.getState().jumpTo(landAt)
      useFallStore.getState().finish()
    }

    const begin = (progress: number) => {
      const player = usePlayerStore.getState()
      const standZ = fallStandZ(progress - fall.startDistance, player.speed)
      // Lock first: `Player` and the input stand down while falling, the deck starts to break,
      // and the store writes below can't re-enter `check`.
      useFallStore.getState().begin(standZ)
      // Freeze where input wanted to go.
      usePlayerStore.setState({ targetProgress: progress, speed: 0 })

      // Take over from the camera where it is, unless it isn't where the player stands
      // (a dev teleport, before `Player` has caught up): then start from the path.
      const c = Math.cos(start.yaw)
      const s = Math.sin(start.yaw)
      generator.path.getPointAt(progress, scratch)
      scratch.y += EYE_HEIGHT
      const fromCamera = camera.position.distanceTo(scratch) < TAKEOVER_SNAP
      const from = fromCamera ? camera.position : scratch
      euler.setFromQuaternion(camera.quaternion, 'YXZ')
      const dx = from.x - start.x
      const dz = from.z - start.z
      const pose: Pose = {
        x: dx * c - dz * s,
        y: from.y - start.y,
        z: dx * s + dz * c,
        yaw: fromCamera ? wrapAngle(euler.y - start.yaw) : 0,
        pitch: fromCamera ? euler.x : 0,
        roll: fromCamera ? euler.z : 0,
        dip: 0,
        nod: 0,
        speed: 0,
        light: 0,
      }

      const light: LightSource = {
        x: from.x,
        y: from.y,
        z: from.z,
        intensity: 0,
        distance: CARRIED_LIGHT_DISTANCE,
        flicker: false,
        phase: 0,
      }

      const top = EYE_HEIGHT - DECK_SAG
      const bottom = -FALL_DROP + EYE_HEIGHT
      // Accelerate, then brake, with the speed matching where the two meet: a quadratic each way.
      const accelDepth = ((top - bottom) * FALL_ACCEL) / (FALL_ACCEL + FALL_BRAKE)

      const tl = gsap.timeline()
      // The floor lurches: stumble forward with the walking momentum, settle onto the middle.
      tl.to(pose, { z: standZ, duration: STUMBLE_TIME, ease: 'power1.out' }, 0)
      tl.to(pose, { x: 0, yaw: 0, roll: 0, duration: 1, ease: 'power2.inOut' }, 0)
      tl.to(pose, { y: EYE_HEIGHT, duration: 0.6, ease: 'sine.out' }, 0)
      tl.to(pose, { pitch: DECK_LOOK_PITCH, duration: 0.9, ease: 'power2.out' }, 0.05)
      tl.to(pose, { light: CARRIED_LIGHT_DECK, duration: 0.8, ease: 'sine.out' }, 0)
      // The planks sag, then give.
      tl.to(pose, { y: top, duration: FALL_START - FLOOR_GIVES + 0.25, ease: 'power1.in' }, FLOOR_GIVES - 0.25)
      // The fall: pitch down, accelerate for FALL_ACCEL, brake for FALL_BRAKE.
      tl.to(pose, { pitch: FALL_PITCH, duration: PITCH_DOWN_TIME, ease: 'power2.inOut' }, FALL_START - 0.15)
      tl.to(pose, { y: top - accelDepth, duration: FALL_ACCEL, ease: 'power1.in' }, FALL_START)
      tl.to(pose, { y: bottom, duration: FALL_BRAKE, ease: 'power1.out' }, FALL_START + FALL_ACCEL)
      tl.to(pose, { speed: 1, duration: FALL_ACCEL, ease: 'none' }, FALL_START)
      tl.to(pose, { speed: 0, duration: FALL_BRAKE, ease: 'none' }, FALL_START + FALL_ACCEL)
      tl.to(pose, { z: -FALL_FORWARD, duration: DRIFT_TIME, ease: 'sine.inOut' }, FALL_START)
      tl.to(pose, { light: 1, duration: 1.2, ease: 'sine.inOut' }, FALL_START)
      // Level out and land softly.
      tl.to(pose, { pitch: 0, duration: LEVEL_TIME, ease: 'power2.inOut' }, LANDING - LEVEL_TIME)
      tl.to(pose, { light: 0, duration: 1.4, ease: 'sine.inOut' }, LANDING - 1.4)
      tl.to(pose, { dip: -LAND_DIP, nod: LAND_NOD, duration: 0.22, ease: 'power1.out' }, LANDING - 0.04)
      tl.to(pose, { dip: 0, nod: 0, duration: 0.6, ease: 'power2.inOut' }, LANDING + 0.18)
      tl.call(finish, [], FALL_END)

      run.current = {
        fall,
        pose,
        timeline: tl,
        light,
        removeLight: addLightSources([light]),
        baseFov: camera.fov,
        time: 0,
      }
    }

    const check = (progress: number) => {
      if (useFallStore.getState().phase !== 'idle') return
      // Teleported clean past the Fall (dev): it never happens, but the way back is still sealed.
      if (progress >= landAt) {
        useFallStore.getState().finish()
        seal()
      } else if (progress >= fall.startDistance) {
        begin(progress)
      }
    }

    check(usePlayerStore.getState().progress)
    const unsubscribe = usePlayerStore.subscribe((s) => check(s.progress))
    return () => {
      unsubscribe()
      // Unmounted mid-fall (hot reload): land at once rather than leave input locked.
      if (run.current) finish()
    }
  }, [generator, camera, scene])

  useFrame((state, delta) => {
    const r = run.current
    if (!r) return
    const camera = state.camera as PerspectiveCamera
    const p = r.pose
    const { start } = r.fall
    r.time += Math.min(delta, MAX_DT)

    const t = r.time
    const shake = reduced.current ? 0 : p.speed
    const roll = WOBBLE_ROLL * shake * (0.65 * Math.sin(t * 1.9) + 0.35 * Math.sin(t * 3.3 + 1.1))
    const wobblePitch = WOBBLE_PITCH * shake * Math.sin(t * 2.3 + 0.4)

    const c = Math.cos(start.yaw)
    const s = Math.sin(start.yaw)
    const y = p.y + p.dip
    camera.position.set(start.x + p.x * c + p.z * s, start.y + y, start.z - p.x * s + p.z * c)
    const yaw = start.yaw + p.yaw
    const pitch = p.pitch + p.nod + wobblePitch
    camera.rotation.set(pitch, yaw, p.roll + roll, 'YXZ')

    const fov = r.baseFov + (reduced.current ? 0 : FOV_KICK * fallIntensity(p.speed))
    if (camera.fov !== fov) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
    fallFx.speed = p.speed
    scaleFog(state.scene, 1 + (FALL_FOG_SCALE - 1) * fallIntensity(p.speed))

    // The carried light sits ahead along the view: on the deck while it breaks, below while falling.
    const cp = Math.cos(pitch)
    r.light.x = camera.position.x - Math.sin(yaw) * cp * CARRIED_LIGHT_AHEAD
    r.light.y = camera.position.y + Math.sin(pitch) * CARRIED_LIGHT_AHEAD
    r.light.z = camera.position.z - Math.cos(yaw) * cp * CARRIED_LIGHT_AHEAD
    r.light.intensity = CARRIED_LIGHT_INTENSITY * p.light
  }, -1)

  return null
}
