import { useEffect } from 'react'
import { Leva, button, levaStore, monitor, useControls } from 'leva'
import { audioEngine } from '../audio/AudioEngine'
import { getLiveFigures } from '../scene/figures/liveFigures'
import { distantCastleStats, frameStats } from '../scene/frameStats'
import { requestGutter } from '../scene/signs/lanternGutter'
import { forcePresence, presenceFx, requestRipple } from '../scene/signs/presenceFx'
import { emitBiwa, onBiwa } from '../state/biwa'
import { cameraFx } from '../state/cameraFx'
import { onFootstep } from '../state/footsteps'
import { discoverFigure } from '../state/hiddenFigures'
import { onSign, type SignEvent, type SignKind } from '../state/signs'
import { ATMOSPHERE_DEFAULTS, useAtmosphereStore } from '../state/useAtmosphereStore'
import { useFigureStore } from '../state/useFigureStore'
import { useGameStore } from '../state/useGameStore'
import { usePlayerStore } from '../state/usePlayerStore'
import { useShiftStore } from '../state/useShiftStore'
import { useSubtitleStore } from '../state/useSubtitleStore'
import { useWorldStore } from '../state/useWorldStore'
import { FIGURES } from '../world/figures'
import { RANDOM_SEGMENT_KINDS, SEGMENT_DEFINITIONS, type RandomSegmentKind } from '../world/segments/registry'
import { spawnOverride } from '../world/spawns/tuning'

const readProgress = () => usePlayerStore.getState().progress
const readSpeed = () => usePlayerStore.getState().speed
let footstepCount = 0
const readFootsteps = () => footstepCount
const readCalls = () => `${frameStats.calls} calls, ${(frameStats.triangles / 1000).toFixed(0)}k tris, ${frameStats.programs} shaders`
const readDistant = () => {
  const d = distantCastleStats
  return `${d.pieces} pieces (${d.near} near, ${d.queued} queued), ${d.ms.toFixed(2)} ms (peak ${d.peakMs.toFixed(2)})`
}
// Strings, because leva shows numbers to two significant figures.
const readSeed = () => String(useWorldStore.getState().seed)
const readRoom = () => {
  const w = useWorldStore.getState()
  return `${w.room} (furthest ${w.furthestRoom})`
}
const readJunction = () => {
  const n = useWorldStore.getState().untilJunction
  return Number.isFinite(n) ? (n <= 0 ? 'next room' : `after ${n} more room${n === 1 ? '' : 's'}`) : 'not yet'
}
let biwaCount = 0
let lastBiwa = 'none yet'
const readBiwa = () => `${biwaCount} (last: ${lastBiwa})`
const readRoll = () => `${Math.round((cameraFx.roll * 180) / Math.PI)}°`
const readArea = () => {
  const w = useWorldStore.getState()
  return `${w.kanji}  ${w.area}`
}
// Sample lines for the HUD's subtitle area, until the castle has things to say.
const SAMPLE_SUBTITLES: [en: string, ja: string, duration: number][] = [
  ['The doors close behind you.', '背後で扉が閉まる。', 3],
  ['Someone is counting the lanterns.', '誰かが提灯を数えている。', 4],
  ['There is no exit.', '出口はない。', 2.5],
]
let subtitleIndex = 0

const readFound = () => {
  const found = useFigureStore.getState().found
  const n = found.filter(Boolean).length
  return `${n} / ${found.length}${n ? ` (${found.flatMap((f, i) => (f ? [i + 1] : [])).join(' ')})` : ''}`
}
const readLiveFigures = () => {
  const live = getLiveFigures()
  if (live.length === 0) return 'none mounted'
  return live.map((f) => `No. ${f.index + 1}: ${f.distance.toFixed(1)} m, ${f.dwell.toFixed(1)} s`).join(' | ')
}
const readPresence = () => {
  const p = presenceFx
  if (p.level <= 0) return 'none'
  const who = p.figure >= 0 ? `No. ${p.figure + 1}${Number.isFinite(p.distance) ? ` at ${p.distance.toFixed(1)} m` : ''}` : 'forced'
  return `${p.level.toFixed(2)}, ${who}, ${Math.round(p.bpm)} bpm`
}
const signCounts: Record<SignKind, number> = { heartbeat: 0, presence: 0, ripple: 0, lantern: 0, biwa: 0 }
let lastSign = 'none yet'
function describeSign(e: SignEvent) {
  switch (e.kind) {
    case 'heartbeat':
      return `heartbeat ${Math.round(e.bpm)} bpm`
    case 'presence':
      return `presence ${e.state}${e.reason ? ` (${e.reason})` : ''}`
    case 'ripple':
      return `ripple ${e.level.toFixed(2)}`
    case 'lantern':
      return `lantern at ${e.distance.toFixed(1)} m`
    case 'biwa':
      return `biwa (${e.reason})`
  }
}
const readSigns = () => {
  const c = signCounts
  return `beats ${c.heartbeat}, presence ${c.presence}, ripples ${c.ripple}, lanterns ${c.lantern}, biwa ${c.biwa} | last: ${lastSign}`
}

/** Dev: a door 3 m to the right and 3 m ahead. */
function playDoorAround(kind: 'slide-open' | 'slide-close' | 'gate', duration: number) {
  const [x, y, z] = audioEngine.worldAround(3, 3)
  audioEngine.door({ kind, x, y: y - 1.2, z, duration })
}

/** The first figure not found yet, or the first one if all are. */
const nextHidden = () => Math.max(0, useFigureStore.getState().found.indexOf(false))

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
  useEffect(
    () =>
      onBiwa((event) => {
        biwaCount++
        lastBiwa = event.kind ? `${event.reason}, ${event.kind}` : event.reason
      }),
    [],
  )

  useEffect(
    () =>
      onSign((event) => {
        signCounts[event.kind]++
        lastSign = describeSign(event)
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
    'distant castle': monitor(readDistant, { interval: 250 }),
    room: monitor(readRoom, { interval: 100 }),
    area: monitor(readArea, { interval: 100 }),
    'forking hall': monitor(readJunction, { interval: 100 }),
    'next kind': {
      value: 'random',
      options: KIND_OPTIONS,
      onChange: (v: RandomSegmentKind | 'random') => useWorldStore.getState().setForcedKind(v === 'random' ? null : v),
    },
    'skip to next segment': button(() => usePlayerStore.getState().jumpTo(useWorldStore.getState().segmentEnd + 0.5)),
  })

  // The special chambers and the room shift. The chamber buttons rebuild the rooms ahead at once
  // and put you at the new room's door; "biwa" plays a room shift where you stand.
  useControls('Special', {
    'inverted chamber': button(() => useShiftStore.getState().requestRoom('inverted')),
    'central abyss': button(() => useShiftStore.getState().requestRoom('abyss')),
    'biwa (room shift)': button(() => emitBiwa({ reason: 'dev' })),
    'biwa events': monitor(readBiwa, { interval: 200 }),
    'camera roll': monitor(readRoll, { interval: 100 }),
  })

  useControls('Guide', {
    open: button(() => useGameStore.getState().openGuide()),
  })

  // The hidden figures. "go to next hidden" rebuilds the rooms ahead so the next one is the first
  // unfound figure's area (with its figure in it) and puts you at its door. "find next" finds it
  // at once (card, line, save), and the sixth starts the finale.
  useControls('Figures', {
    found: monitor(readFound, { interval: 200 }),
    mounted: monitor(readLiveFigures, { interval: 100 }),
    'always appear': {
      value: spawnOverride.always,
      onChange: (v: boolean) => {
        spawnOverride.always = v
      },
    },
    'go to next hidden': button(() => {
      // Ticks the box too (its onChange sets the override).
      levaStore.setValueAtPath('Figures.always appear', true, false)
      useShiftStore.getState().requestRoom(FIGURES[nextHidden()].area)
    }),
    'find next': button(() => {
      const next = useFigureStore.getState().found.indexOf(false)
      if (next >= 0) discoverFigure(next)
    }),
    'reset figures': button(() => useFigureStore.getState().resetFound()),
  })

  // The signs. "presence" is the strength felt from the nearest unfound figure; "force presence"
  // holds it at a strength (0: off, the figures decide) to see the look without a figure.
  useControls('Signs', {
    presence: monitor(readPresence, { interval: 100 }),
    events: monitor(readSigns, { interval: 150 }),
    'force presence': {
      value: 0,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v: number) => forcePresence(v > 0 ? v : null),
    },
    ripple: button(requestRipple),
    'gutter a lantern': button(requestGutter),
  })

  // Each sound on its own, played from the engine (with sound on). Doors and the crackle come from
  // the right of the view, so the panning shows.
  useControls('Audio', {
    context: monitor(() => audioEngine.state, { interval: 250 }),
    'step (walk)': button(() => audioEngine.footstep({ foot: 'left', speed: 1.4, running: false, progress: 0 })),
    'step (run)': button(() => audioEngine.footstep({ foot: 'right', speed: 3.4, running: true, progress: 0 })),
    'shoji open': button(() => playDoorAround('slide-open', 1.6)),
    'shoji shut': button(() => playDoorAround('slide-close', 1.55)),
    'gate doors': button(() => playDoorAround('gate', 2.6)),
    crackle: button(() => {
      const [x, y, z] = audioEngine.worldAround(3, 3)
      audioEngine.lantern(x, y, z, 1.05, 0)
    }),
    'biwa only': button(() => audioEngine.biwa()),
    heartbeat: button(() => audioEngine.heartbeat(90, 0.6)),
    'ripple swell': button(() => audioEngine.ripple(0.8, 2.6)),
    'shift rumble': button(() => audioEngine.shiftRumble(1.5)),
    'fall (sound only)': button(() => audioEngine.fallStart()),
  })

  useControls('HUD', {
    'show subtitle': button(() => {
      const [en, ja, duration] = SAMPLE_SUBTITLES[subtitleIndex++ % SAMPLE_SUBTITLES.length]
      useSubtitleStore.getState().showSubtitle(en, ja, duration)
    }),
    'toggle sound': button(() => {
      const game = useGameStore.getState()
      game.setSoundEnabled(!game.soundEnabled)
    }),
  })

  return <Leva titleBar={{ title: 'Dev' }} />
}
