import { filter, freeOnEnd, jitter, noise, thump, toMix, type Voices } from './nodes'
import { RIPPLE_GAIN, RUMBLE_GAIN } from './tuning'

/**
 * A dark ripple rolling through the halls: a low swell of noise that opens and closes over the
 * ripple's `duration`, with a sub tone sinking under it.
 */
export function playRipple(v: Voices, level: number, duration: number) {
  const { ctx } = v
  const t = ctx.currentTime + 0.01
  const end = t + duration
  const peak = RIPPLE_GAIN * (0.4 + 0.6 * level)

  const src = noise(v, v.brown, t, end + 0.1)
  const low = filter(v, 'lowpass', 80, 2)
  low.frequency.setValueAtTime(80, t)
  low.frequency.exponentialRampToValueAtTime(320, t + duration * 0.35)
  low.frequency.exponentialRampToValueAtTime(70, end)
  const g = swell(ctx, t, end, peak, 0.35)
  src.connect(low).connect(g)
  toMix(v, g, 0.4)
  freeOnEnd(src, low, g)

  const sub = new OscillatorNode(ctx, { type: 'sine', frequency: 58 })
  sub.frequency.setValueAtTime(58, t)
  sub.frequency.exponentialRampToValueAtTime(36, end)
  const sg = swell(ctx, t, end, peak * 0.6, 0.3)
  sub.connect(sg).connect(v.out)
  sub.start(t)
  sub.stop(end + 0.05)
  freeOnEnd(sub, sg)
}

/**
 * The rooms moving in a shift: a low rumble of timber over `duration`, with a few heavy
 * knocks as the rooms land.
 */
export function playShiftRumble(v: Voices, duration: number) {
  const { ctx } = v
  const t = ctx.currentTime + 0.01
  const end = t + duration

  const src = noise(v, v.brown, t, end + 0.2)
  const low = filter(v, 'lowpass', 150, 1.2)
  const g = swell(ctx, t, end, RUMBLE_GAIN, 0.12)
  src.connect(low).connect(g)
  toMix(v, g, 0.5)
  freeOnEnd(src, low, g)

  for (let i = 0; i < 3; i++) {
    const at = t + duration * (0.45 + 0.18 * i) * jitter(0.1)
    toMix(v, thump(v, at, 130 * jitter(0.15), 60, RUMBLE_GAIN * (0.9 - 0.2 * i), 0.22), 0.6)
  }
}

/** Rises to `peak` at `top` (share of the way through), then falls back to silence at `end`. */
function swell(ctx: AudioContext, t: number, end: number, peak: number, top: number) {
  const g = new GainNode(ctx, { gain: 0 })
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak, t + (end - t) * top)
  g.gain.linearRampToValueAtTime(0, end)
  return g
}
