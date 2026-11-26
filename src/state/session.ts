import { fallFx } from '../scene/fall/fallFx'
import { resetLanternGutter } from '../scene/signs/lanternGutter'
import { resetPresenceFx } from '../scene/signs/presenceFx'
import { cameraFx } from './cameraFx'
import { finaleFx } from './finaleFx'
import { scriptedWalk } from './scriptedWalk'
import { useFallStore } from './useFallStore'
import { useFigureStore } from './useFigureStore'
import { useForkStore } from './useForkStore'
import { useGameStore } from './useGameStore'
import { usePlayerStore } from './usePlayerStore'
import { useShiftStore } from './useShiftStore'
import { useSubtitleStore } from './useSubtitleStore'
import { useWorldStore } from './useWorldStore'

/**
 * Puts every piece of a visit's state back as it was at first load, so the castle can be
 * entered again after the finale. Call it from the title screen, while the castle is not
 * mounted (nothing must be subscribed while the stores jump back). Keeps the sound choice the
 * title screen just made, and re-reads the figures found from saved progress.
 */
export function resetSession() {
  const { soundEnabled } = useGameStore.getState()
  for (const store of [useGameStore, usePlayerStore, useWorldStore, useFallStore, useForkStore, useShiftStore] as const) {
    // Each store's own initial state, actions included.
    ;(store.setState as (state: unknown, replace: true) => void)(store.getInitialState(), true)
  }
  useGameStore.setState({ soundEnabled })
  useSubtitleStore.getState().clearSubtitle()
  useFigureStore.getState().load()

  cameraFx.roll = 0
  cameraFx.rollPivot = 0
  cameraFx.shake = 0
  scriptedWalk.active = false
  scriptedWalk.progress = 0
  fallFx.speed = 0
  finaleFx.red = 0
  resetPresenceFx()
  resetLanternGutter()
}
