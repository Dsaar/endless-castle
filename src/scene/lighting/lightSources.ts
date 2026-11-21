/**
 * Every lantern (and the few other warm lights) registers a light source here instead of
 * owning a three.js light. `LightPool` lights only the nearest few each frame, so the number
 * of real lights never changes as segments mount and unmount: shaders compile once.
 *
 * Mutable module state, read every frame: not a zustand store, so nothing re-renders.
 */
export interface LightSource {
  /** World position. */
  x: number
  y: number
  z: number
  /** Point light intensity (candela) at full strength. */
  intensity: number
  /** Reach in meters (the point light's `distance`). */
  distance: number
  /** Lantern flicker (see `lanternFlicker`), or a steady light. */
  flicker: boolean
  /** Keeps neighbouring flickers out of step. */
  phase: number
}

const sources: LightSource[] = []

/** Registers light sources. Returns a function that removes them again. */
export function addLightSources(list: readonly LightSource[]): () => void {
  for (const source of list) sources.push(source)
  return () => {
    for (const source of list) {
      const i = sources.indexOf(source)
      if (i < 0) continue
      // Order doesn't matter: swap with the last one and drop it.
      sources[i] = sources[sources.length - 1]
      sources.pop()
    }
  }
}

/** The live list. Don't hold on to it or change it. */
export function getLightSources(): readonly LightSource[] {
  return sources
}
