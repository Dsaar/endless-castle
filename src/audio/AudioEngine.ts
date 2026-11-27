import { Vector3, type Camera } from 'three'
import type { DoorEvent } from '../state/doors'
import type { Footstep } from '../state/footsteps'
import { Ambience } from './Ambience'
import { playBiwa, prepareBiwa } from './biwa'
import { brownNoise, hallImpulse, whiteNoise } from './buffers'
import { playCrackle } from './crackle'
import { playDoor } from './door'
import { FallRoar } from './FallRoar'
import { playFootstep } from './footstep'
import { playHeartbeat } from './heartbeat'
import { glide, panner, toMix, type Voices } from './nodes'
import { playRipple, playShiftRumble } from './swells'
import {
  CRACKLE_HALL,
  DOOR_HALL,
  HALL_RETURN,
  HALL_SECONDS,
  MASTER_FADE,
  MASTER_GAIN,
  MUFFLE_CUTOFF,
  MUFFLE_FADE,
  SUSPEND_AFTER,
} from './tuning'

/** Everything built when the context is first unlocked. */
interface Graph {
  voices: Voices
  master: GainNode
  muffle: BiquadFilterNode
  ambience: Ambience
  fall: FallRoar
}

const OPEN = 20000
const scratch = new Vector3()

/**
 * The castle's sound, all synthesized live with the Web Audio API: no audio files.
 *
 *     voices ─┬────────────────────────┐
 *             └─ hall (convolver) ─────┤
 *     ambience ────────────────────────┴─ muffle (lowpass) ─ compressor ─ master ─ speakers
 *
 * The AudioContext is made, and resumed, on the title screen's Enter click (`unlock`): browsers
 * only let sound start from a user gesture. The master gain follows the sound toggle; with sound
 * off the context is suspended after the fade, and every one-shot is skipped (so nothing piles
 * up to play at once when it comes back on).
 *
 * Positional sounds (lanterns, doors) go through cheap equal-power panners placed in the
 * camera's space at the moment they start. The listener never moves, so nothing is updated per
 * frame; a sound that lasts a second doesn't need to follow the head.
 *
 * Everything is event-driven (`AudioDirector` connects it): no work at all per frame.
 */
export class AudioEngine {
  private graph: Graph | null = null
  private ctx: AudioContext | null = null
  private enabled = false
  private suspendTimer: ReturnType<typeof setTimeout> | undefined
  private camera: Camera | null = null

  /** Makes and resumes the context. Call from a click (the Enter buttons, the sound toggle). */
  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      try {
        this.ctx = new Ctor({ latencyHint: 'interactive' })
      } catch {
        return
      }
      this.graph = build(this.ctx)
    }
    if (this.enabled && this.ctx.state !== 'running') void this.ctx.resume()
  }

  /** Follows the sound toggle: fades the master in or out, and suspends the context when off. */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    const ctx = this.ctx
    const g = this.graph
    if (!ctx || !g) return
    clearTimeout(this.suspendTimer)
    if (enabled) {
      if (ctx.state !== 'running') void ctx.resume()
      glide(g.master.gain, MASTER_GAIN, ctx.currentTime, MASTER_FADE)
    } else {
      g.fall.stop()
      glide(g.master.gain, 0, ctx.currentTime, MASTER_FADE)
      this.suspendTimer = setTimeout(() => {
        if (!this.enabled && ctx.state === 'running') void ctx.suspend()
      }, SUSPEND_AFTER * 1000)
    }
  }

  /** The camera that positional sounds are placed around. */
  setCamera(camera: Camera | null) {
    this.camera = camera
  }

  /** 'running', 'suspended', 'closed', or 'locked' before the first Enter click. For the dev panel. */
  get state() {
    return this.ctx ? this.ctx.state : 'locked'
  }

  /** The graph, if sound is playing right now; otherwise one-shots are skipped. */
  private live() {
    return this.enabled && this.ctx?.state === 'running' ? this.graph : null
  }

  ambienceIn() {
    this.graph?.ambience.fadeIn()
  }

  ambienceOut(seconds?: number) {
    this.graph?.ambience.fadeOut(seconds)
  }

  /** The guide is open: muffle everything, as if heard through the paper. */
  setMuffled(muffled: boolean) {
    const g = this.graph
    if (g) glide(g.muffle.frequency, muffled ? MUFFLE_CUTOFF : OPEN, g.voices.ctx.currentTime, MUFFLE_FADE)
  }

  setPresence(level: number) {
    this.graph?.ambience.setPresence(level)
  }

  footstep(step: Footstep) {
    const g = this.live()
    if (g) playFootstep(g.voices, step)
  }

  door(event: DoorEvent) {
    const g = this.live()
    if (!g) return
    const p = this.place(g.voices, event.x, event.y + 1.2, event.z, DOOR_HALL)
    playDoor(g.voices, p, event.kind, event.duration)
  }

  lantern(x: number, y: number, z: number, duration: number, presence: number) {
    const g = this.live()
    if (!g) return
    playCrackle(g.voices, this.place(g.voices, x, y, z, CRACKLE_HALL), duration, presence)
  }

  biwa() {
    const g = this.live()
    if (g) playBiwa(g.voices)
  }

  shiftRumble(duration: number) {
    const g = this.live()
    if (g) playShiftRumble(g.voices, duration)
  }

  heartbeat(bpm: number, level: number) {
    const g = this.live()
    if (g) playHeartbeat(g.voices, bpm, level)
  }

  ripple(level: number, duration: number) {
    const g = this.live()
    if (g) playRipple(g.voices, level, duration)
  }

  fallStart() {
    this.live()?.fall.start()
  }

  fallStop() {
    this.graph?.fall.stop()
  }

  /** Dev: the world point `right` m to the right and `ahead` m in front of the camera (or the origin). */
  worldAround(right: number, ahead: number): [number, number, number] {
    scratch.set(right, 0, -ahead)
    if (this.camera) this.camera.localToWorld(scratch)
    return [scratch.x, scratch.y, scratch.z]
  }

  /** A panner at world point (x, y, z), placed in the camera's space now, into the mix. */
  private place(v: Voices, x: number, y: number, z: number, wet: number) {
    scratch.set(x, y, z)
    if (this.camera) scratch.applyMatrix4(this.camera.matrixWorldInverse)
    else scratch.set(0, 0, -3)
    const p = panner(v, scratch.x, scratch.y, scratch.z)
    toMix(v, p, wet)
    return p
  }
}

function build(ctx: AudioContext): Graph {
  const master = new GainNode(ctx, { gain: 0 })
  const compressor = new DynamicsCompressorNode(ctx, { threshold: -14, knee: 10, ratio: 4, attack: 0.004, release: 0.25 })
  const muffle = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: OPEN, Q: 0.5 })
  muffle.connect(compressor).connect(master).connect(ctx.destination)

  const out = new GainNode(ctx, { gain: 1 })
  out.connect(muffle)
  const hall = new ConvolverNode(ctx, { buffer: hallImpulse(ctx, HALL_SECONDS) })
  const hallReturn = new GainNode(ctx, { gain: HALL_RETURN })
  hall.connect(hallReturn).connect(muffle)

  const voices: Voices = { ctx, out, hall, white: whiteNoise(ctx), brown: brownNoise(ctx) }
  prepareBiwa(ctx)
  return { voices, master, muffle, ambience: new Ambience(voices, muffle), fall: new FallRoar(voices) }
}

/** The one sound engine. */
export const audioEngine = new AudioEngine()
