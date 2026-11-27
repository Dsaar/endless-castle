import type { DoorEvent } from '../state/doors'
import { SILENT, filter, freeOnEnd, jitter, noise, thump, type Voices } from './nodes'
import { DOOR_GAIN, GATE_GAIN } from './tuning'

/**
 * A door, into `dest` (a panner at the doorway).
 *
 * - **Shoji:** a filtered noise sweep: a papery band rising and falling with the panels'
 *   ease-in-out, over a low rumble of wood in the track, then a soft knock as they stop (a
 *   sharper clack when they meet, shutting).
 * - **The Gate:** slower and heavier: a deep sweep, a groaning hinge, and a thud as the bar lets go.
 */
export function playDoor(v: Voices, dest: AudioNode, kind: DoorEvent['kind'], duration: number) {
  if (kind === 'gate') playGate(v, dest, duration)
  else playSlide(v, dest, kind === 'slide-close', duration)
}

function playSlide(v: Voices, dest: AudioNode, shutting: boolean, duration: number) {
  const { ctx } = v
  const t = ctx.currentTime + 0.01
  const end = t + duration
  const peak = DOOR_GAIN * jitter(0.1)
  const src = noise(v, v.white, t, end + 0.1)

  // Paper and frame: a band that sweeps up as the panels gather speed, and back down.
  const band = filter(v, 'bandpass', 420, 1.1)
  band.frequency.setValueAtTime(420 * jitter(0.1), t)
  band.frequency.exponentialRampToValueAtTime(1300 * jitter(0.1), t + duration * 0.5)
  band.frequency.exponentialRampToValueAtTime(520, end)
  const swish = envelope(ctx, t, end, peak * 0.5)
  src.connect(band).connect(swish).connect(dest)

  // Wood running in the track.
  const low = filter(v, 'lowpass', 220, 1.5)
  const rumble = envelope(ctx, t, end, peak * 0.9)
  src.connect(low).connect(rumble).connect(dest)
  freeOnEnd(src, band, swish, low, rumble)

  // The stop.
  thump(v, end - 0.04, shutting ? 240 : 160, shutting ? 120 : 90, peak * (shutting ? 0.9 : 0.5), 0.12).connect(dest)
  if (shutting) {
    const clack = noise(v, v.white, end - 0.04, end + 0.05)
    const hp = filter(v, 'bandpass', 2400, 1.5)
    const g = new GainNode(ctx, { gain: SILENT })
    g.gain.setValueAtTime(SILENT, end - 0.04)
    g.gain.exponentialRampToValueAtTime(peak * 0.35, end - 0.035)
    g.gain.exponentialRampToValueAtTime(SILENT, end + 0.04)
    clack.connect(hp).connect(g).connect(dest)
    freeOnEnd(clack, hp, g)
  }
}

function playGate(v: Voices, dest: AudioNode, duration: number) {
  const { ctx } = v
  const t = ctx.currentTime + 0.01
  const end = t + duration
  const peak = GATE_GAIN

  // The bar lets go.
  thump(v, t, 90, 45, peak, 0.35).connect(dest)

  // The weight of the leaves moving air and timber.
  const src = noise(v, v.brown, t, end + 0.2)
  const low = filter(v, 'lowpass', 140, 0.9)
  low.frequency.setValueAtTime(140, t)
  low.frequency.exponentialRampToValueAtTime(420, t + duration * 0.45)
  low.frequency.exponentialRampToValueAtTime(160, end)
  const weight = envelope(ctx, t + 0.1, end, peak * 0.9)
  src.connect(low).connect(weight).connect(dest)
  freeOnEnd(src, low, weight)

  // The hinges groan: a buzzing tone wandering in pitch, through a narrow band.
  const hinge = new OscillatorNode(ctx, { type: 'sawtooth', frequency: 70 })
  const wander = new Float32Array(24)
  let f = 62
  for (let i = 0; i < wander.length; i++) {
    f = Math.min(110, Math.max(45, f + (Math.random() * 2 - 1) * 9))
    wander[i] = f
  }
  hinge.frequency.setValueCurveAtTime(wander, t + 0.15, duration * 0.8)
  const reed = filter(v, 'bandpass', 700, 7)
  const groan = envelope(ctx, t + 0.15, t + duration * 0.95, peak * 0.07)
  hinge.connect(reed).connect(groan).connect(dest)
  hinge.start(t + 0.15)
  hinge.stop(end + 0.1)
  freeOnEnd(hinge, reed, groan)

  // They come to rest.
  thump(v, end - 0.1, 70, 40, peak * 0.6, 0.4).connect(dest)
}

/** Swells from silence to `peak` around the middle of `[t, end]` and back, like an ease-in-out. */
function envelope(ctx: AudioContext, t: number, end: number, peak: number) {
  const g = new GainNode(ctx, { gain: 0 })
  const d = end - t
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak * 0.6, t + d * 0.25)
  g.gain.linearRampToValueAtTime(peak, t + d * 0.5)
  g.gain.linearRampToValueAtTime(peak * 0.5, t + d * 0.8)
  g.gain.linearRampToValueAtTime(0, end)
  return g
}
