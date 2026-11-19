import { Leva, useControls } from 'leva'
import { ATMOSPHERE_DEFAULTS, useAtmosphereStore } from '../state/useAtmosphereStore'

/**
 * Dev-only tuning panel (leva). Loaded lazily behind `import.meta.env.DEV`, so neither
 * this file nor leva ends up in the production bundle.
 */
export default function DevPanel() {
  const setAtmosphere = useAtmosphereStore((s) => s.setAtmosphere)
  const d = ATMOSPHERE_DEFAULTS

  useControls('Fog', {
    density: {
      value: d.fogDensity,
      min: 0,
      max: 0.15,
      step: 0.001,
      onChange: (v: number) => setAtmosphere({ fogDensity: v }),
    },
  })

  useControls('Bloom', {
    intensity: {
      value: d.bloomIntensity,
      min: 0,
      max: 5,
      step: 0.05,
      onChange: (v: number) => setAtmosphere({ bloomIntensity: v }),
    },
    threshold: {
      value: d.bloomThreshold,
      min: 0,
      max: 1.5,
      step: 0.01,
      onChange: (v: number) => setAtmosphere({ bloomThreshold: v }),
    },
    smoothing: {
      value: d.bloomSmoothing,
      min: 0,
      max: 1,
      step: 0.005,
      onChange: (v: number) => setAtmosphere({ bloomSmoothing: v }),
    },
    radius: {
      value: d.bloomRadius,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v: number) => setAtmosphere({ bloomRadius: v }),
    },
  })

  return <Leva titleBar={{ title: 'Dev' }} />
}
