import { useRef } from 'react'
import { useFrame, type RootState } from '@react-three/fiber'
import { Vector3 } from 'three'
import { emitSign } from '../../state/signs'
import { useFallStore } from '../../state/useFallStore'
import { useGameStore } from '../../state/useGameStore'
import { getLightSources, type LightSource } from '../lighting/lightSources'
import { gutterLevel, lanternGutter } from './lanternGutter'
import { presenceFx } from './presenceFx'
import {
  GUTTER_DURATION,
  GUTTER_EVERY_MAX,
  GUTTER_EVERY_MIN,
  GUTTER_FIRST_MIN,
  GUTTER_IN_VIEW,
  GUTTER_NEAR,
  GUTTER_PRESENCE_RATE,
  GUTTER_REACH,
  GUTTER_RETRY,
} from './tuning'

const forward = new Vector3()
const onScreen = new Vector3()

/** The first wait after entering: never too soon. */
function firstWait() {
  return GUTTER_FIRST_MIN + Math.random() * (GUTTER_EVERY_MAX - GUTTER_FIRST_MIN)
}

function nextWait() {
  return GUTTER_EVERY_MIN + Math.random() * (GUTTER_EVERY_MAX - GUTTER_EVERY_MIN)
}

/** Walking about freely: not in the intro, the Fall or the finale, and the guide is shut. */
function quiet() {
  const game = useGameStore.getState()
  return game.introComplete && !game.guideOpen && !game.finale && useFallStore.getState().phase !== 'falling'
}

/**
 * A random flickering lantern within GUTTER_REACH of the camera and on screen, nearer ones
 * likelier, or null. A gutter nobody sees is no sign. Picks without building a list.
 */
function pickLantern(camera: RootState['camera']): LightSource | null {
  const sources = getLightSources()
  const cam = camera.position
  camera.getWorldDirection(forward)
  let pick: LightSource | null = null
  let total = 0
  for (let i = 0; i < sources.length; i++) {
    const s = sources[i]
    if (!s.flicker || s.intensity <= 0) continue
    const dx = s.x - cam.x
    const dy = s.y - cam.y
    const dz = s.z - cam.z
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz)
    if (d > GUTTER_REACH || dx * forward.x + dy * forward.y + dz * forward.z <= 0) continue
    onScreen.set(s.x, s.y, s.z).project(camera)
    if (Math.abs(onScreen.x) > GUTTER_IN_VIEW || Math.abs(onScreen.y) > GUTTER_IN_VIEW) continue
    const weight = 1 / Math.max(d, GUTTER_NEAR)
    total += weight
    if (Math.random() * total < weight) pick = s
  }
  return pick
}

/**
 * THE GUTTERING LANTERN: now and then a lantern near the player flickers hard and dims for
 * about a second. With no figure near it happens every 12–28 s; the wait runs up to eight
 * times faster as a hidden figure's presence grows, so the lanterns around you shiver when
 * one is close. Only a lantern on screen gutters (nearer ones likelier). Writes
 * `lanternGutter` (read by the light pool and the lantern paper) and emits a `lantern` sign.
 * The wait pauses in the intro, the Fall, the finale and the guide.
 */
export default function LanternGutterDirector() {
  /** Seconds until the next gutter (set on the first frame). */
  const wait = useRef(Number.NaN)

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.1)
    const g = lanternGutter
    if (Number.isNaN(wait.current)) wait.current = firstWait()

    if (g.source) {
      g.elapsed += dt
      if (g.elapsed >= GUTTER_DURATION) {
        g.source = null
        g.level = 1
      } else {
        g.level = gutterLevel(g.elapsed, g.seed)
      }
      return
    }

    if (!g.requested) {
      if (!quiet()) return
      wait.current -= dt * (1 + presenceFx.level * GUTTER_PRESENCE_RATE)
      if (wait.current > 0) return
    }
    g.requested = false

    const source = pickLantern(camera)
    if (!source) {
      wait.current = GUTTER_RETRY
      return
    }
    wait.current = nextWait()
    g.source = source
    g.elapsed = 0
    g.seed = Math.random() * 1000
    g.level = gutterLevel(0, g.seed)
    const cam = camera.position
    emitSign({
      kind: 'lantern',
      x: source.x,
      y: source.y,
      z: source.z,
      distance: Math.hypot(source.x - cam.x, source.y - cam.y, source.z - cam.z),
      duration: GUTTER_DURATION,
      presence: presenceFx.level,
    })
  })

  return null
}
