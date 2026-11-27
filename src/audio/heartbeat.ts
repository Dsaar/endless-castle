import { HEARTBEAT_DUB_DELAY, HEARTBEAT_DUB_SHARE } from '../scene/signs/tuning'
import { filter, freeOnEnd, hit, noise, thump, type Voices } from './nodes'
import { HEART_GAIN } from './tuning'

/**
 * One heartbeat: two low sine thumps, lub then dub, HEARTBEAT_DUB_DELAY apart (the same gap
 * as the vignette's pulse, so they land together). `PresenceDirector` sends a beat at a rate
 * set by the presence (54 bpm at the edge of its range up to 116 bpm close by); stronger
 * presence also makes each beat louder, and faster beats die away sooner. Dry and centered:
 * it is felt, not in the room.
 */
export function playHeartbeat(v: Voices, bpm: number, level: number) {
  const t = v.ctx.currentTime + 0.005
  const peak = HEART_GAIN * (0.35 + 0.65 * level)
  const decay = Math.min(0.26, (0.3 * 60) / Math.max(bpm, 1))
  beat(v, t, peak, 64, decay)
  beat(v, t + HEARTBEAT_DUB_DELAY, peak * HEARTBEAT_DUB_SHARE, 56, decay * 0.85)
}

function beat(v: Voices, t: number, peak: number, pitch: number, decay: number) {
  thump(v, t, pitch, pitch * 0.62, peak, decay).connect(v.out)
  // The chest: a soft, very low noise thud under the tone.
  const src = noise(v, v.brown, t, t + decay + 0.05)
  const low = filter(v, 'lowpass', 110, 0.8)
  const g = hit(v, t, peak * 0.5, 0.01, decay * 0.7)
  src.connect(low).connect(g).connect(v.out)
  freeOnEnd(src, low, g)
}
