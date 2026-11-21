import { useEffect } from 'react'
import { Leva, button, monitor, useControls } from 'leva'
import { frameStats } from '../scene/frameStats'
import { onFootstep } from '../state/footsteps'
import { ATMOSPHERE_DEFAULTS, useAtmosphereStore } from '../state/useAtmosphereStore'
import { useFigureStore } from '../state/useFigureStore'
import { useGameStore } from '../state/useGameStore'
import { usePlayerStore } from '../state/usePlayerStore'
import { useWorldStore } from '../state/useWorldStore'
import { RANDOM_SEGMENT_KINDS, SEGMENT_DEFINITIONS, type RandomSegmentKind } from '../world/segments/registry'

const readProgress = () => usePlayerStore.getState().progress
const readSpeed = () => usePlayerStore.getState().speed
let footstepCount = 0
const readFootsteps = () => footstepCount
const readCalls = () => `${frameStats.calls} calls, ${(frameStats.triangles / 1000).toFixed(0)}k tris, ${frameStats.programs} shaders`
// Strings, because leva shows numbers to two significant figures.
const readSeed = () => String(useWorldStore.getState().seed)
const readRoom = () => {
  const w = useWorldStore.getState()
  return `${w.room} (furthest ${w.furthestRoom})`
}
const readArea = () => {
  const w = useWorldStore.getState()
  return `${w.kanji}  ${w.area}`
}
const KIND_OPTIONS: Record<string, RandomSegmentKind | 'random'> = {
  random: 'random',
  ...Object.fromEntries(RANDOM_SEGMENT_KINDS.map((k) => [SEGMENT_DEFINITIONS[k].area, k])),
}

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

  // Where the player is in the castle. "next kind" forces every segment generated from now on
  // (about 3 ahead are already built, so it shows up a few segments later; skip to get there).
  useControls('World', {
    seed: monitor(readSeed, { interval: 500 }),
    renderer: monitor(readCalls, { interval: 250 }),
    room: monitor(readRoom, { interval: 100 }),
    area: monitor(readArea, { interval: 100 }),
    'next kind': {
      value: 'random',
      options: KIND_OPTIONS,
      onChange: (v: RandomSegmentKind | 'random') => useWorldStore.getState().setForcedKind(v === 'random' ? null : v),
    },
    'skip to next segment': button(() => usePlayerStore.getState().jumpTo(useWorldStore.getState().segmentEnd + 0.5)),
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
