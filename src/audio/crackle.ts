import { SILENT, filter, freeOnEnd, noise, type Voices } from './nodes'
import { CRACKLE_GAIN } from './tuning'

/** The hard stutter at the start of a gutter lasts this long (matches the light's). */
const STUTTER = 0.5

/**
 * A lantern guttering, into `dest` (a panner at the lantern): a soft crackle of tiny clicks,
 * thick while the flame stutters and sparse as it recovers, over a low flutter of the flame
 * gasping. One noise source, two filters and two gains, however many clicks: the clicks are
 * written into the gain's automation, not made as nodes.
 */
export function playCrackle(v: Voices, dest: AudioNode, duration: number, presence: number) {
  const { ctx } = v
  const t = ctx.currentTime + 0.01
  const end = t + duration + 0.15
  const peak = CRACKLE_GAIN * (0.8 + 0.4 * presence)
  const src = noise(v, v.white, t, end)

  // The clicks.
  const band = filter(v, 'bandpass', 3000, 0.8)
  const clicks = new GainNode(ctx, { gain: SILENT })
  let at = t
  while (at < t + duration) {
    const stutter = at - t < STUTTER
    const amp = peak * (stutter ? 0.4 + 0.6 * Math.random() : 0.15 + 0.35 * Math.random())
    const length = 0.004 + Math.random() * 0.014
    clicks.gain.setValueAtTime(SILENT, at)
    clicks.gain.exponentialRampToValueAtTime(amp, at + 0.0015)
    clicks.gain.exponentialRampToValueAtTime(SILENT, at + length)
    at += length + (stutter ? 0.012 + Math.random() * 0.045 : 0.06 + Math.random() * 0.16)
  }
  src.connect(band).connect(clicks).connect(dest)

  // The flame: a breath that dips as the light does and comes back.
  const low = filter(v, 'lowpass', 520, 0.8)
  const breath = new GainNode(ctx, { gain: 0 })
  breath.gain.setValueAtTime(0, t)
  breath.gain.linearRampToValueAtTime(peak * 0.35, t + 0.06)
  breath.gain.linearRampToValueAtTime(peak * 0.12, t + STUTTER)
  breath.gain.linearRampToValueAtTime(peak * 0.2, t + duration)
  breath.gain.linearRampToValueAtTime(0, end)
  src.connect(low).connect(breath).connect(dest)
  freeOnEnd(src, band, clicks, low, breath)
}
