import { PAN_MAX_DISTANCE, PAN_REF_DISTANCE } from './tuning'

/** What every voice plays into. */
export interface Voices {
  ctx: AudioContext
  /** The dry effects bus. */
  out: AudioNode
  /** The hall's reverb send. */
  hall: AudioNode
  white: AudioBuffer
  brown: AudioBuffer
}

/** The quietest level an exponential ramp can aim at (it can't reach 0). */
export const SILENT = 0.0001

/** A noise buffer playing from a random point, looped. Started at `t`, stopped at `stop` (or never). */
export function noise(v: Voices, buffer: AudioBuffer, t: number, stop?: number) {
  const src = new AudioBufferSourceNode(v.ctx, { buffer, loop: true })
  src.start(t, Math.random() * buffer.duration)
  if (stop !== undefined) src.stop(stop)
  return src
}

export function filter(v: Voices, type: BiquadFilterType, frequency: number, Q = 0.7) {
  return new BiquadFilterNode(v.ctx, { type, frequency, Q })
}

/** A gain node that rises to `peak` over `attack` from `t`, then dies away over `decay`. */
export function hit(v: Voices, t: number, peak: number, attack: number, decay: number) {
  const g = new GainNode(v.ctx, { gain: SILENT })
  g.gain.setValueAtTime(SILENT, t)
  g.gain.exponentialRampToValueAtTime(Math.max(peak, SILENT * 2), t + attack)
  g.gain.exponentialRampToValueAtTime(SILENT, t + attack + decay)
  return g
}

/** Connects `from` to the dry bus and sends `wet` of it to the hall. */
export function toMix(v: Voices, from: AudioNode, wet: number, dry: AudioNode = v.out) {
  from.connect(dry)
  if (wet > 0) {
    const send = new GainNode(v.ctx, { gain: wet })
    from.connect(send).connect(v.hall)
  }
}

/** Frees a chain once its source has finished. */
export function freeOnEnd(src: AudioScheduledSourceNode, ...nodes: AudioNode[]) {
  src.onended = () => {
    src.disconnect()
    for (const n of nodes) n.disconnect()
  }
}

/**
 * A low sine thump whose pitch drops from `from` to `to` Hz: footfalls, knocks, heartbeats.
 * Returns its output (already enveloped) so the caller connects it.
 */
export function thump(v: Voices, t: number, from: number, to: number, peak: number, decay: number) {
  const osc = new OscillatorNode(v.ctx, { type: 'sine', frequency: from })
  osc.frequency.setValueAtTime(from, t)
  osc.frequency.exponentialRampToValueAtTime(to, t + decay * 0.7)
  const g = hit(v, t, peak, 0.006, decay)
  osc.connect(g)
  osc.start(t)
  osc.stop(t + decay + 0.05)
  freeOnEnd(osc, g)
  return g
}

/**
 * An equal-power panner at a point in the listener's (camera's) space: −z ahead, +x right.
 * Cheap: no HRTF. The listener stays at the origin facing −z, so nothing moves per frame.
 */
export function panner(v: Voices, x: number, y: number, z: number) {
  return new PannerNode(v.ctx, {
    panningModel: 'equalpower',
    distanceModel: 'linear',
    refDistance: PAN_REF_DISTANCE,
    maxDistance: PAN_MAX_DISTANCE,
    rolloffFactor: 1,
    positionX: x,
    positionY: y,
    positionZ: z,
  })
}

/** Glides an AudioParam from where it is now toward `value` (time constant `tau`). */
export function glide(param: AudioParam, value: number, now: number, tau: number) {
  param.cancelScheduledValues(now)
  param.setValueAtTime(param.value, now)
  param.setTargetAtTime(value, now, tau)
}

export function jitter(amount: number) {
  return 1 + (Math.random() * 2 - 1) * amount
}
