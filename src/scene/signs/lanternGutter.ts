import { smoothstep } from '../../lib/math'
import type { LightSource } from '../lighting/lightSources'
import { GUTTER_DURATION, GUTTER_LOW, GUTTER_STUTTER_RATE } from './tuning'

/**
 * The lantern guttering right now, if any: chosen by `LanternGutterDirector`, which also writes
 * `level` each frame. `LightPool` dims that source's light by `level`, and the lantern's paper
 * (`LanternInstances`, `Lantern`) dims with it (`gutterPaper`). Only one gutters at a time.
 *
 * Mutable module state, read every frame: not a store, so nothing re-renders.
 */
export const lanternGutter = {
  source: null as LightSource | null,
  /** Seconds since it began. */
  elapsed: 0,
  /** Multiplies the source's light: 1 untouched, near 0 almost out. */
  level: 1,
  /** Keeps each gutter's stutter different. */
  seed: 0,
  /** Dev: gutter a lantern on the next frame. */
  requested: false,
}

export function resetLanternGutter() {
  lanternGutter.source = null
  lanternGutter.elapsed = 0
  lanternGutter.level = 1
  lanternGutter.requested = false
}

/** Dev: gutter a lantern near the camera on the next frame. */
export function requestGutter() {
  lanternGutter.requested = true
}

/** A repeatable 0 … 1 value for an integer step and a seed. Allocation-free. */
function hash(step: number, seed: number) {
  const x = Math.sin(step * 127.1 + seed * 311.7) * 43758.5453
  return x - Math.floor(x)
}

/**
 * How much of a guttering lantern's light is left, `t` seconds in: it catches and stutters
 * hard on and off (stepped, so it looks the same at any frame rate), settles low, then climbs
 * back to 1 by GUTTER_DURATION.
 */
export function gutterLevel(t: number, seed: number) {
  if (t <= 0 || t >= GUTTER_DURATION) return 1
  const u = t / GUTTER_DURATION
  // In fast, held, back out over the last 40%.
  const dip = smoothstep(0, 0.06, u) * (1 - smoothstep(0.6, 1, u))
  // The stutter: about two steps in three lit, the rest nearly out; it calms as it dims.
  const lit = hash(Math.floor(t * GUTTER_STUTTER_RATE), seed) > 0.45
  const flick = lit ? 1 : 0
  const calm = smoothstep(0.35, 0.6, u)
  const low = flick + (GUTTER_LOW - flick) * calm
  return 1 + (low - 1) * dip
}

/** The paper glow follows the light, but never goes quite dark (the flame is still in there). */
export function gutterPaper(level: number) {
  return 0.04 + 0.96 * level
}

/** The paper glow multiplier for `source` this frame: 1 unless it is the one guttering. */
export function gutterPaperFor(source: LightSource | null | undefined) {
  return source && source === lanternGutter.source ? gutterPaper(lanternGutter.level) : 1
}
