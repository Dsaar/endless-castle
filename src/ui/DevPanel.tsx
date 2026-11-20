import { useEffect } from 'react'
import { Leva, button, monitor, useControls } from 'leva'
import { onFootstep } from '../state/footsteps'
import { ATMOSPHERE_DEFAULTS, useAtmosphereStore } from '../state/useAtmosphereStore'
import { useFigureStore } from '../state/useFigureStore'
import { useGameStore } from '../state/useGameStore'
import { usePlayerStore } from '../state/usePlayerStore'

const readProgress = () => usePlayerStore.getState().progress
const readSpeed = () => usePlayerStore.getState().speed
let footstepCount = 0
const readFootsteps = () => footstepCount

/**
 * Dev-only tuning panel (leva). Loaded lazily behind `import.meta.env.DEV`, so neither
 * this file nor leva ends up in the production bundle.
 */
export default function DevPanel() {
  const setAtmosphere = useAtmosphereStore((s) => s.setAtmosphere)
  const d = ATMOSPHERE_DEFAULTS

  useEffect(
    () =>
      onFootstep(() => {
        footstepCount++
      }),
    [],
  )

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

  // Read-only: where the player is, how fast they're going, and how many footsteps so far.
  useControls('Player', {
    'progress (m)': monitor(readProgress, { interval: 50 }),
    'speed (m/s)': monitor(readSpeed, { graph: true, interval: 30 }),
    footsteps: monitor(readFootsteps, { interval: 100 }),
  })

  // Until the figures exist in the world: mark them found by hand to test the guide's slots.
  useControls('Guide', {
    open: button(() => useGameStore.getState().openGuide()),
    'find a figure': button(() => {
      const { found, markFound } = useFigureStore.getState()
      const next = found.indexOf(false)
      if (next >= 0) markFound(next)
    }),
    'reset figures': button(() => useFigureStore.getState().resetFound()),
  })

  return <Leva titleBar={{ title: 'Dev' }} />
}
