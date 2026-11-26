/**
 * How strongly a hidden figure's presence is felt right now, written by `PresenceDirector`
 * (and its GSAP ripples) and read every frame by `PostEffects` and `LanternGutterDirector`.
 *
 * Mutable module state, like `fallFx`: not a store, so nothing re-renders.
 */
export const presenceFx = {
  /** 0: nothing near. 1: an unfound figure is right here. Ramps over a few seconds. */
  level: 0,
  /** Index into FIGURES of the figure being felt, or −1. */
  figure: -1,
  /** Its distance from the camera (meters), or Infinity. */
  distance: Infinity,
  /** The heartbeat's rate now (0 when there is no presence). */
  bpm: 0,
  /** This frame's heartbeat pulse (lub, then dub), already scaled by `level`. */
  pulse: 0,
  /** The ripple: where it starts (UV, may be off the screen), how far its front has rolled
   * (screen heights) and how dark it is (0 … 1, 0 when there is none). */
  rippleX: 0.5,
  rippleY: 0.5,
  rippleRadius: 0,
  rippleStrength: 0,
  /** Dev: hold the presence at this strength (−1: off, the figures decide). */
  forced: -1,
  /** Dev: roll a ripple on the next frame. */
  rippleRequested: false,
}

export type PresenceFx = typeof presenceFx

/** Dev: roll a ripple now, from the nearest figure's side (or the right if there is none). */
export function requestRipple() {
  presenceFx.rippleRequested = true
}

/** Dev: hold the presence at `level` (0 … 1), or give it back to the figures (null). */
export function forcePresence(level: number | null) {
  presenceFx.forced = level === null ? -1 : level
}

export function resetPresenceFx() {
  presenceFx.level = 0
  presenceFx.figure = -1
  presenceFx.distance = Infinity
  presenceFx.bpm = 0
  presenceFx.pulse = 0
  presenceFx.rippleRadius = 0
  presenceFx.rippleStrength = 0
  presenceFx.rippleRequested = false
}
