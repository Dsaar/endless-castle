import { create } from 'zustand'

/** Tunable look of the void: fog and bloom. The dev panel writes these; the scene reads them. */
export interface AtmosphereValues {
  /** FogExp2 density. Higher means the castle dissolves into black sooner. */
  fogDensity: number
  /** Bloom strength. */
  bloomIntensity: number
  /** Luminance above which pixels start to bloom (0 to 1+, in linear HDR). */
  bloomThreshold: number
  /** Softness of the threshold edge. */
  bloomSmoothing: number
  /** Spread of the mipmap blur (0 to 1). */
  bloomRadius: number
}

export const ATMOSPHERE_DEFAULTS: AtmosphereValues = {
  fogDensity: 0.035,
  bloomIntensity: 1.2,
  bloomThreshold: 0.6,
  bloomSmoothing: 0.03,
  bloomRadius: 0.85,
}

interface AtmosphereState extends AtmosphereValues {
  setAtmosphere: (patch: Partial<AtmosphereValues>) => void
}

export const useAtmosphereStore = create<AtmosphereState>()((set) => ({
  ...ATMOSPHERE_DEFAULTS,
  setAtmosphere: (patch) => set(patch),
}))
