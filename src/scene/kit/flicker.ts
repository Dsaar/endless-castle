/**
 * A lantern's flicker, around 1: layered sines, a slow breath, a quicker waver and a fast
 * shimmer. Lantern paper and the pooled light both use it with the same time and phase,
 * so the glow and the light it throws pulse together. Allocation-free.
 */
export function lanternFlicker(time: number, phase: number) {
  const t = time + phase * 7.31
  return (
    1 + 0.07 * Math.sin(t * 1.7) + 0.06 * Math.sin(t * 6.3 + 1.3) + 0.035 * Math.sin(t * 17.9 + 0.4) + 0.02 * Math.sin(t * 31.3)
  )
}

/** How strongly the paper glow follows the flicker (the light follows it fully). */
export function paperGlow(flicker: number) {
  return 0.75 + 0.25 * flicker
}
