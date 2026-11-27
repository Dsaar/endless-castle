import { clamp } from '../lib/math'
import { MAX_SPEED } from '../scene/player/tuning'
import type { Footstep } from '../state/footsteps'
import { filter, freeOnEnd, hit, jitter, noise, thump, toMix, type Voices } from './nodes'
import { STEP_CREAK_CHANCE, STEP_GAIN, STEP_HALL, STEP_PITCH_JITTER } from './tuning'

/**
 * A footfall on cedar boards: a short burst of noise through a bandpass (the heel on the
 * board) over a low sine thump (the floor taking the weight), both a little off in pitch
 * each time. Running steps come faster (the player emits one per 0.8 m), harder, brighter
 * and shorter. Left and right feet sit a touch apart in stereo. Now and then a walking step
 * makes a board creak.
 */
export function playFootstep(v: Voices, step: Footstep) {
  const { ctx } = v
  const t = ctx.currentTime + 0.005
  const pitch = jitter(STEP_PITCH_JITTER)
  const pace = clamp(step.speed / MAX_SPEED, 0, 1)
  const level = STEP_GAIN * (0.55 + 0.45 * pace) * (step.running ? 1.25 : 1) * jitter(0.15)
  const decay = step.running ? 0.055 : 0.085

  const pan = new StereoPannerNode(ctx, { pan: step.foot === 'left' ? -0.12 : 0.12 })
  toMix(v, pan, STEP_HALL)

  // The heel on the board.
  const src = noise(v, v.white, t, t + decay + 0.05)
  const band = filter(v, 'bandpass', (step.running ? 1500 : 1050) * pitch, 1.3)
  const click = hit(v, t, level * 0.45, 0.003, decay)
  src.connect(band).connect(click).connect(pan)
  freeOnEnd(src, band, click)

  // The floor taking the weight.
  thump(v, t, 120 * pitch, 58 * pitch, level, step.running ? 0.1 : 0.14).connect(pan)

  // A board creaks.
  if (!step.running && Math.random() < STEP_CREAK_CHANCE) {
    const at = t + 0.03
    const creak = noise(v, v.white, at, at + 0.35)
    const reed = filter(v, 'bandpass', 380 * jitter(0.2), 14)
    reed.frequency.setValueAtTime(reed.frequency.value, at)
    reed.frequency.linearRampToValueAtTime(reed.frequency.value * 1.25, at + 0.28)
    const g = hit(v, at, level * 0.7, 0.06, 0.24)
    creak.connect(reed).connect(g).connect(pan)
    freeOnEnd(creak, reed, g)
  }
}
