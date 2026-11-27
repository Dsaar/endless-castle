/**
 * Sample buffers computed once in JS: white and brown noise, the hall's impulse response, and
 * Karplus-Strong plucks for the biwa. No audio files.
 */

/** Seconds of noise in each looping noise buffer (long enough that the loop isn't heard). */
const NOISE_SECONDS = 3

export function whiteNoise(ctx: BaseAudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * NOISE_SECONDS), ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

/** Brown (red) noise: integrated white noise, all rumble and no hiss. Good for wind. */
export function brownNoise(ctx: BaseAudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * NOISE_SECONDS), ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
    data[i] = last * 3.5
  }
  // Fade the ends together so the loop doesn't click.
  const blend = Math.floor(ctx.sampleRate * 0.05)
  for (let i = 0; i < blend; i++) {
    const t = i / blend
    const j = data.length - blend + i
    data[j] = data[j] * (1 - t) + data[i] * t
  }
  return buffer
}

/**
 * A big wooden hall: stereo noise that dies away exponentially over `seconds`, darkening as
 * it goes (a one-pole lowpass whose cutoff falls), with a few early reflections.
 */
export function hallImpulse(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const rate = ctx.sampleRate
  const length = Math.floor(rate * seconds)
  const buffer = ctx.createBuffer(2, length, rate)
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c)
    let low = 0
    for (let i = 0; i < length; i++) {
      const t = i / length
      const decay = Math.pow(1 - t, 3.2)
      const k = 0.55 - 0.45 * t
      low += k * (Math.random() * 2 - 1 - low)
      data[i] = low * decay
    }
    // Early reflections off near walls, a little different on each side.
    for (const ms of c === 0 ? [11, 23, 37, 52] : [14, 29, 41, 61]) {
      const i = Math.floor((ms / 1000) * rate)
      if (i < length) data[i] += 0.5 * (1 - ms / 80)
    }
  }
  return buffer
}

/**
 * A plucked string by Karplus-Strong: a burst of (softened) noise circulating in a delay line
 * one period long, averaged each pass so the highs die first. `bright` (0 … 1) is how hard
 * the plectrum strikes; `sustain` (0 … 1) how slowly the string dies.
 *
 * The loop's length rounds to whole samples, so `rate` is the playbackRate that corrects the pitch.
 */
export function pluck(ctx: BaseAudioContext, frequency: number, seconds: number, bright: number, sustain: number) {
  const rate = ctx.sampleRate
  const period = Math.max(2, Math.round(rate / frequency - 0.5))
  const buffer = ctx.createBuffer(1, Math.floor(rate * seconds), rate)
  const data = buffer.getChannelData(0)
  const ring = new Float32Array(period)
  // The excitation: noise through a one-pole lowpass (softer plectrum = darker burst).
  const k = 0.15 + 0.85 * bright
  let low = 0
  for (let i = 0; i < period; i++) {
    low += k * (Math.random() * 2 - 1 - low)
    ring[i] = low
  }
  // Remove the burst's DC offset so the string doesn't thump.
  let mean = 0
  for (let i = 0; i < period; i++) mean += ring[i]
  mean /= period
  for (let i = 0; i < period; i++) ring[i] -= mean

  const loss = 0.990 + 0.0095 * sustain
  let index = 0
  for (let i = 0; i < data.length; i++) {
    const next = (index + 1) % period
    const value = ring[index]
    data[i] = value
    let fed = loss * 0.5 * (value + ring[next])
    // Sawari: the biwa's frets let the string buzz against them. A touch of fold-back on the
    // strongest swings keeps some bright buzz alive in the sustain.
    if (fed > 0.35) fed = 0.35 - (fed - 0.35) * 0.6
    else if (fed < -0.35) fed = -0.35 - (fed + 0.35) * 0.6
    ring[index] = fed
    index = next
  }
  return { buffer, rate: frequency / (rate / (period + 0.5)) }
}
