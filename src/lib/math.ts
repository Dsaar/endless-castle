/** Small scalar helpers. None of them allocate, so they are safe to call every frame. */

export function clamp(value: number, min: number, max: number) {
  return value < min ? min : value > max ? max : value
}

/** Hermite ramp from 0 at `edge0` to 1 at `edge1`. */
export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * Frame-rate independent exponential approach to `target`. `lambda` is a rate per second:
 * the value covers about 95% of the gap in 3 / lambda seconds.
 */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return target + (current - target) * Math.exp(-lambda * dt)
}

/** A value with a velocity, moved by `smoothDamp`. */
export interface Spring {
  value: number
  velocity: number
}

/**
 * Critically damped spring toward `target` (the Game Programming Gems 4 approximation, as in
 * Unity's SmoothDamp). The velocity stays continuous whatever the target does, so a target
 * that jumps in steps (wheel ticks) still gives smooth motion. `maxSpeed` caps the speed;
 * the spring never overshoots. Updates `spring` in place.
 */
export function smoothDamp(spring: Spring, target: number, smoothTime: number, maxSpeed: number, dt: number) {
  const omega = 2 / smoothTime
  const x = omega * dt
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)
  const maxChange = maxSpeed * smoothTime
  const change = clamp(spring.value - target, -maxChange, maxChange)
  const reachable = spring.value - change
  const temp = (spring.velocity + omega * change) * dt
  let velocity = (spring.velocity - omega * temp) * decay
  let value = reachable + (change + temp) * decay
  // Never step past the real target.
  if (target - spring.value > 0 === value > target) {
    value = target
    velocity = 0
  }
  spring.value = value
  spring.velocity = velocity
}
