import { pluck } from './buffers'
import { filter, freeOnEnd, hit, noise, thump, toMix, type Voices } from './nodes'
import { BIWA_GAIN, BIWA_HALL } from './tuning'

/** The biwa's strings, tuned to the miyako-bushi scale on E (E F A B C). */
const E2 = 82.41
const NOTES = {
  E2,
  F2: E2 * 2 ** (1 / 12),
  A2: E2 * 2 ** (5 / 12),
  B2: E2 * 2 ** (7 / 12),
  C3: E2 * 2 ** (8 / 12),
  E3: E2 * 2,
  F3: E2 * 2 * 2 ** (1 / 12),
} as const
type Note = keyof typeof NOTES

/** Seconds of ring computed for each string. */
const RING = 3.2

interface Pluck {
  note: Note
  /** Seconds into the phrase. */
  at: number
  gain: number
  /** Push the string up a semitone this long after the pluck (the biwa's bend). */
  bend?: number
}

/**
 * Short phrases, each the sound of one room shift: a hard strum across the low strings, or a
 * single struck note answered by another, sometimes bent.
 */
const PHRASES: readonly (readonly Pluck[])[] = [
  [
    { note: 'E2', at: 0, gain: 1 },
    { note: 'B2', at: 0.03, gain: 0.7 },
    { note: 'E3', at: 0.06, gain: 0.6 },
    { note: 'F3', at: 0.75, gain: 0.55, bend: 0.35 },
  ],
  [
    { note: 'A2', at: 0, gain: 1, bend: 0.5 },
    { note: 'E2', at: 0.9, gain: 0.7 },
  ],
  [
    { note: 'E2', at: 0, gain: 1 },
    { note: 'F2', at: 0.035, gain: 0.6 },
    { note: 'C3', at: 0.5, gain: 0.55 },
    { note: 'B2', at: 0.85, gain: 0.5 },
  ],
  [
    { note: 'B2', at: 0, gain: 0.9 },
    { note: 'E3', at: 0.02, gain: 0.7 },
    { note: 'C3', at: 0.6, gain: 0.6, bend: 0.3 },
  ],
]

const cache = new Map<Note, ReturnType<typeof pluck>>()

function string(ctx: AudioContext, note: Note) {
  let s = cache.get(note)
  if (!s) {
    s = pluck(ctx, NOTES[note], RING, 0.75, 0.85)
    cache.set(note, s)
  }
  return s
}

/** Computes every string's ring ahead of time, so the first shift doesn't hitch. */
export function prepareBiwa(ctx: AudioContext) {
  for (const note of Object.keys(NOTES) as Note[]) string(ctx, note)
}

/**
 * A biwa string plucked somewhere in the castle: one of PHRASES, played on Karplus-Strong
 * strings, each struck with a big plectrum (a click and a knock on the body), settling flat
 * from slightly sharp as the strike lets go, some bent up a semitone, through a warm lowpass
 * and well into the hall's reverb. It comes from a random side.
 */
export function playBiwa(v: Voices) {
  const { ctx } = v
  const t0 = ctx.currentTime + 0.02
  const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)]
  const pan = new StereoPannerNode(ctx, { pan: (Math.random() * 2 - 1) * 0.45 })
  const body = filter(v, 'lowpass', 3400, 0.9)
  body.connect(pan)
  toMix(v, pan, BIWA_HALL)

  for (const p of phrase) {
    const t = t0 + p.at
    const { buffer, rate } = string(ctx, p.note)
    const src = new AudioBufferSourceNode(ctx, { buffer })
    src.playbackRate.setValueAtTime(rate * 1.025, t)
    src.playbackRate.exponentialRampToValueAtTime(rate, t + 0.09)
    if (p.bend !== undefined) {
      src.playbackRate.setValueAtTime(rate, t + p.bend)
      src.playbackRate.linearRampToValueAtTime(rate * 2 ** (1 / 12), t + p.bend + 0.22)
    }
    const g = new GainNode(ctx, { gain: BIWA_GAIN * p.gain })
    // Let it ring, then damp it before the buffer runs out.
    g.gain.setValueAtTime(BIWA_GAIN * p.gain, t + RING - 0.6)
    g.gain.linearRampToValueAtTime(0, t + RING - 0.05)
    src.connect(g).connect(body)
    src.start(t)
    freeOnEnd(src, g)

    // The plectrum: a click and a knock on the body.
    const click = noise(v, v.white, t, t + 0.05)
    const band = filter(v, 'bandpass', 1900, 1.6)
    const cg = hit(v, t, BIWA_GAIN * p.gain * 0.3, 0.002, 0.025)
    click.connect(band).connect(cg).connect(pan)
    freeOnEnd(click, band, cg)
    thump(v, t, 230, 160, BIWA_GAIN * p.gain * 0.25, 0.05).connect(pan)
  }
}
