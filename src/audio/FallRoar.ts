import { COLLAPSE_START, FALL_ACCEL, FALL_START, FLOOR_GIVES, LANDING } from '../world/segments/fall/timing'
import { SILENT, filter, glide, jitter, noise, thump, toMix, type Voices } from './nodes'
import { CRACK_GAIN, LAND_GAIN, ROAR_GAIN } from './tuning'

/**
 * THE FALL's sound, scheduled all at once on the Fall's own clock (`fall/timing.ts`), so it
 * stays in step with the camera without any per-frame work:
 *
 * - The deck: planks crack ahead from COLLAPSE_START, running away from you, and the floor
 *   under you gives with a splintering crash at FLOOR_GIVES.
 * - The roar: wind rising from FALL_START as you accelerate (a lowpass opening from a hollow
 *   rush to a full roar, with a whistle climbing above it and a buffeting tremolo), then
 *   falling away as you brake.
 * - The landing: a soft double thump at LANDING.
 *
 * `stop` cuts it short (sound turned off, or the Fall ended early).
 */
export class FallRoar {
  private readonly v: Voices
  private nodes: { sources: AudioScheduledSourceNode[]; out: GainNode } | null = null

  constructor(v: Voices) {
    this.v = v
  }

  start() {
    this.stop()
    const v = this.v
    const { ctx } = v
    const t0 = ctx.currentTime + 0.01
    const top = t0 + FALL_START + FALL_ACCEL
    const land = t0 + LANDING
    const out = new GainNode(ctx, { gain: 1 })
    toMix(v, out, 0.15)
    const sources: AudioScheduledSourceNode[] = []

    // The deck cracking: splits running away from you, then the crash.
    for (let at = COLLAPSE_START; at < FLOOR_GIVES - 0.1; at += 0.07 + Math.random() * 0.12) {
      const far = (at - COLLAPSE_START) / (FLOOR_GIVES - COLLAPSE_START)
      sources.push(crack(v, out, t0 + at, CRACK_GAIN * (0.75 - 0.45 * far) * jitter(0.2), 900 * jitter(0.25)))
    }
    sources.push(crack(v, out, t0 + FLOOR_GIVES, CRACK_GAIN * 1.3, 600, 0.35))
    thump(v, t0 + FLOOR_GIVES, 95, 40, CRACK_GAIN, 0.4).connect(out)

    // The roar.
    const wind = noise(v, v.white, t0 + FALL_START - 0.3, land + 0.8)
    sources.push(wind)
    const low = filter(v, 'lowpass', 220, 0.6)
    low.frequency.setValueAtTime(220, t0 + FALL_START)
    low.frequency.exponentialRampToValueAtTime(3600, top)
    low.frequency.exponentialRampToValueAtTime(260, land)
    const roar = new GainNode(ctx, { gain: SILENT })
    roar.gain.setValueAtTime(SILENT, t0 + FALL_START - 0.3)
    roar.gain.exponentialRampToValueAtTime(ROAR_GAIN * 0.12, t0 + FALL_START + 0.4)
    roar.gain.exponentialRampToValueAtTime(ROAR_GAIN, top)
    roar.gain.exponentialRampToValueAtTime(ROAR_GAIN * 0.08, land - 0.2)
    roar.gain.exponentialRampToValueAtTime(SILENT, land + 0.7)
    // Buffeting: a tremolo that deepens with the speed.
    const buffet = new GainNode(ctx, { gain: 1 })
    const flutter = new OscillatorNode(ctx, { type: 'sine', frequency: 6.5 })
    const depth = new GainNode(ctx, { gain: 0 })
    depth.gain.setValueAtTime(0, t0 + FALL_START)
    depth.gain.linearRampToValueAtTime(0.3, top)
    depth.gain.linearRampToValueAtTime(0, land)
    flutter.connect(depth).connect(buffet.gain)
    flutter.start(t0 + FALL_START)
    flutter.stop(land + 0.8)
    sources.push(flutter)
    wind.connect(low).connect(roar).connect(buffet).connect(out)

    // The whistle: a narrow band climbing with the speed.
    const whistle = filter(v, 'bandpass', 500, 5)
    whistle.frequency.setValueAtTime(500, t0 + FALL_START)
    whistle.frequency.exponentialRampToValueAtTime(1900, top)
    whistle.frequency.exponentialRampToValueAtTime(600, land)
    const wg = new GainNode(ctx, { gain: 0.35 })
    wind.connect(whistle).connect(wg).connect(roar)

    // The landing.
    thump(v, land, 110, 50, LAND_GAIN, 0.22).connect(out)
    thump(v, land + 0.16, 120, 55, LAND_GAIN * 0.6, 0.16).connect(out)

    this.nodes = { sources, out }
    wind.onended = () => {
      if (this.nodes?.out === out) this.nodes = null
      out.disconnect()
    }
  }

  stop() {
    const n = this.nodes
    if (!n) return
    this.nodes = null
    const now = this.v.ctx.currentTime
    glide(n.out.gain, 0, now, 0.08)
    for (const s of n.sources) {
      try {
        s.stop(now + 0.4)
      } catch {
        // Not started yet, or already stopped: nothing to cut.
      }
    }
  }
}

/** A plank splitting: a sharp burst of noise through a band, with a short splintery tail. */
function crack(v: Voices, out: AudioNode, t: number, peak: number, frequency: number, tail = 0.09) {
  const src = noise(v, v.white, t, t + tail + 0.05)
  const band = filter(v, 'bandpass', frequency, 1.4)
  const g = new GainNode(v.ctx, { gain: SILENT })
  g.gain.setValueAtTime(SILENT, t)
  g.gain.exponentialRampToValueAtTime(peak, t + 0.003)
  g.gain.exponentialRampToValueAtTime(peak * 0.2, t + 0.02)
  g.gain.exponentialRampToValueAtTime(SILENT, t + tail)
  src.connect(band).connect(g).connect(out)
  return src
}
