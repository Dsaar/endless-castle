import { useEffect } from 'react'
import { SHIFT_TIME } from '../scene/shift/tuning'
import { onDoor } from '../state/doors'
import { onFootstep } from '../state/footsteps'
import { onSign } from '../state/signs'
import { useFallStore } from '../state/useFallStore'
import { CARD_DURATION } from '../state/useFigureStore'
import { useGameStore } from '../state/useGameStore'
import { useShiftStore } from '../state/useShiftStore'
import { audioEngine } from './AudioEngine'

/** In the finale, the ambience dies away over about this long once the lights turn red. */
const FINALE_FADE = 9

/**
 * Connects the sound engine to the castle while it is mounted (alongside the canvas). Renders
 * nothing. Every sound comes from an event or a store change; nothing runs per frame.
 *
 * | Source | Sound |
 * | --- | --- |
 * | `soundEnabled` | master gain (and suspend) |
 * | `guideOpen` | everything muffled |
 * | `onFootstep` | footsteps on wood |
 * | `onDoor` | sliding shoji, the Gate's leaves |
 * | `onSign` lantern | a crackle at the lantern |
 * | `onSign` biwa | a biwa phrase; the shift that follows (`useShiftStore`) rumbles |
 * | `onSign` heartbeat / presence | lub-dub; the drone darkens with the presence |
 * | `onSign` ripple | a low swell |
 * | `useFallStore` falling | the deck cracks, the roar rises, the landing |
 * | `finale` | a last biwa as the lights turn red, then the ambience fades |
 */
export default function AudioDirector() {
  useEffect(() => {
    const game = useGameStore.getState()
    audioEngine.setEnabled(game.soundEnabled)
    audioEngine.setMuffled(game.guideOpen)
    audioEngine.setPresence(0)
    audioEngine.ambienceIn()

    let finaleTimer: ReturnType<typeof setTimeout> | undefined
    const unsubscribeGame = useGameStore.subscribe((s, prev) => {
      if (s.soundEnabled !== prev.soundEnabled) audioEngine.setEnabled(s.soundEnabled)
      if (s.guideOpen !== prev.guideOpen) audioEngine.setMuffled(s.guideOpen)
      if (s.finale && !prev.finale) {
        audioEngine.setPresence(0)
        finaleTimer = setTimeout(() => {
          audioEngine.biwa()
          audioEngine.ambienceOut(FINALE_FADE)
        }, CARD_DURATION * 1000)
      }
    })

    const unsubscribeSteps = onFootstep((step) => audioEngine.footstep(step))
    const unsubscribeDoors = onDoor((door) => audioEngine.door(door))
    const unsubscribeSigns = onSign((sign) => {
      switch (sign.kind) {
        case 'heartbeat':
          audioEngine.heartbeat(sign.bpm, sign.level)
          audioEngine.setPresence(sign.level)
          break
        case 'presence':
          audioEngine.setPresence(sign.state === 'begin' ? 0.25 : 0)
          break
        case 'ripple':
          audioEngine.ripple(sign.level, sign.duration)
          break
        case 'lantern':
          audioEngine.lantern(sign.x, sign.y, sign.z, sign.duration, sign.presence)
          break
        case 'biwa':
          audioEngine.biwa()
          break
      }
    })
    const unsubscribeShift = useShiftStore.subscribe((s, prev) => {
      if (s.active && s.active !== prev.active) audioEngine.shiftRumble(SHIFT_TIME)
    })
    const unsubscribeFall = useFallStore.subscribe((s, prev) => {
      if (s.phase === 'falling' && prev.phase !== 'falling') audioEngine.fallStart()
    })

    return () => {
      clearTimeout(finaleTimer)
      unsubscribeGame()
      unsubscribeSteps()
      unsubscribeDoors()
      unsubscribeSigns()
      unsubscribeShift()
      unsubscribeFall()
      audioEngine.fallStop()
      audioEngine.setPresence(0)
      audioEngine.ambienceOut()
    }
  }, [])

  return null
}
