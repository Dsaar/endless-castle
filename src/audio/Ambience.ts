import { filter, glide, noise, type Voices } from './nodes'
import {
  AMBIENCE_FADE_IN,
  AMBIENCE_FADE_OUT,
  DRONE_CUTOFF,
  DRONE_GAIN,
  DRONE_ROOT,
  GUST_DEPTH,
  GUST_LFO_HZ,
  PRESENCE_CUTOFF,
  PRESENCE_DRONE,
  PRESENCE_GLIDE,
  PRESENCE_UNEASE,
  PRESENCE_WIND_DROP,
  WIND_CUTOFF,
  WIND_GAIN,
  WIND_LFO_HZ,
  WIND_SWEEP,
} from './tuning'

/**
 * The castle's bed of sound, built once and left running (its level fades in and out):
 *
 * - **Wind:** brown noise through a bandpass whose center drifts on a slow LFO, and a second,
 *   slower LFO that swells it in gusts.
 * - **Drone:** a low sine root, a slightly detuned twin (a slow beating), and a quiet sawtooth a
 *   fifth up, through a lowpass that breathes on its own LFO.
 * - **Presence:** near a hidden figure the drone grows and opens, a sour tone a tritone up
 *   beats against it, and the wind drops away.
 */
export class Ambience {
  private readonly v: Voices
  private readonly level: GainNode
  private readonly wind: GainNode
  private readonly drone: GainNode
  private readonly droneFilter: BiquadFilterNode
  private readonly unease: GainNode

  constructor(v: Voices, out: AudioNode) {
    this.v = v
    const { ctx } = v
    const now = ctx.currentTime
    this.level = new GainNode(ctx, { gain: 0 })
    this.level.connect(out)

    // Wind.
    const wind = noise(v, v.brown, now)
    const band = filter(v, 'bandpass', WIND_CUTOFF, 0.9)
    const sweep = lfo(ctx, WIND_LFO_HZ, WIND_SWEEP, now)
    sweep.connect(band.frequency)
    const gust = new GainNode(ctx, { gain: 1 - GUST_DEPTH / 2 })
    lfo(ctx, GUST_LFO_HZ, GUST_DEPTH / 2, now).connect(gust.gain)
    this.wind = new GainNode(ctx, { gain: WIND_GAIN })
    wind.connect(band).connect(gust).connect(this.wind).connect(this.level)
    // A thinner, higher whistle on top, drifting on its own.
    const whistle = filter(v, 'bandpass', 900, 6)
    lfo(ctx, WIND_LFO_HZ * 1.7, 260, now).connect(whistle.frequency)
    const whistleGain = new GainNode(ctx, { gain: 0.05 })
    wind.connect(whistle).connect(whistleGain).connect(gust)

    // Drone.
    this.droneFilter = filter(v, 'lowpass', DRONE_CUTOFF, 1.2)
    lfo(ctx, 0.031, DRONE_CUTOFF * 0.25, now).connect(this.droneFilter.frequency)
    this.drone = new GainNode(ctx, { gain: DRONE_GAIN })
    this.droneFilter.connect(this.drone).connect(this.level)
    tone(ctx, 'sine', DRONE_ROOT, 1, now).connect(this.droneFilter)
    tone(ctx, 'sine', DRONE_ROOT * 1.004, 0.7, now).connect(this.droneFilter)
    tone(ctx, 'sawtooth', DRONE_ROOT * 1.5, 0.12, now).connect(this.droneFilter)
    tone(ctx, 'triangle', DRONE_ROOT * 2, 0.18, now).connect(this.droneFilter)

    // Unease: silent until a figure is near.
    this.unease = new GainNode(ctx, { gain: 0 })
    this.unease.connect(this.level)
    const sour = filter(v, 'lowpass', 400, 0.7)
    sour.connect(this.unease)
    tone(ctx, 'triangle', DRONE_ROOT * 2 * Math.SQRT2, 1, now).connect(sour)
    tone(ctx, 'triangle', DRONE_ROOT * 2 * Math.SQRT2 * 1.012, 0.8, now).connect(sour)
  }

  fadeIn(seconds = AMBIENCE_FADE_IN) {
    glide(this.level.gain, 1, this.v.ctx.currentTime, seconds / 3)
  }

  fadeOut(seconds = AMBIENCE_FADE_OUT) {
    glide(this.level.gain, 0, this.v.ctx.currentTime, seconds / 3)
  }

  /** How strongly a hidden figure is felt, 0 … 1. */
  setPresence(level: number) {
    const now = this.v.ctx.currentTime
    glide(this.drone.gain, DRONE_GAIN * (1 + PRESENCE_DRONE * level), now, PRESENCE_GLIDE)
    glide(this.droneFilter.frequency, DRONE_CUTOFF + (PRESENCE_CUTOFF - DRONE_CUTOFF) * level, now, PRESENCE_GLIDE)
    glide(this.unease.gain, PRESENCE_UNEASE * level * level, now, PRESENCE_GLIDE)
    glide(this.wind.gain, WIND_GAIN * (1 - PRESENCE_WIND_DROP * level), now, PRESENCE_GLIDE)
  }
}

/** A running oscillator scaled by `gain`. */
function tone(ctx: AudioContext, type: OscillatorType, frequency: number, gain: number, t: number) {
  const osc = new OscillatorNode(ctx, { type, frequency })
  const g = new GainNode(ctx, { gain })
  osc.connect(g)
  osc.start(t)
  return g
}

/** A slow sine LFO of the given depth, to connect to an AudioParam. Starts at a random phase. */
function lfo(ctx: AudioContext, frequency: number, depth: number, t: number) {
  const osc = new OscillatorNode(ctx, { type: 'sine', frequency })
  const g = new GainNode(ctx, { gain: depth })
  osc.connect(g)
  osc.start(t + Math.random() / frequency)
  return g
}
