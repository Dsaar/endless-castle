import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { finaleFx } from '../state/finaleFx'
import { CARD_DURATION, useFigureStore } from '../state/useFigureStore'
import { useGameStore } from '../state/useGameStore'
import { useSubtitleStore } from '../state/useSubtitleStore'
import { FINALE_LINE } from '../world/figures'
import './FinaleOverlay.css'

/** Seconds for every light to turn red. */
const RED_TIME = 3.5
/** Seconds the final line stays up before the fade. */
const LINE_TIME = 5
/** Seconds to fade to black, then the pause in the dark before the title screen. */
const FADE_TIME = 2.2
const DARK_HOLD = 0.8

/**
 * The placeholder finale, once all six figures are found (`useGameStore.finale`). Input is
 * locked from the start. After the sixth FOUND card has had its time, every light turns
 * vermilion (`finaleFx.red`: the light pool, the fill and the red grade), the final line
 * appears, the screen fades to black and the title screen comes back. Saved progress is cleared
 * as it begins, so the next visit starts with all six hidden again.
 */
export default function FinaleOverlay() {
  const finale = useGameStore((s) => s.finale)
  const curtain = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!finale) return
    useFigureStore.getState().forgetSaved()
    const timeline = gsap.timeline()
    timeline
      .to(finaleFx, { red: 1, duration: RED_TIME, ease: 'power2.inOut' }, CARD_DURATION)
      .call(() => useSubtitleStore.getState().showSubtitle(FINALE_LINE.en, FINALE_LINE.ja, LINE_TIME))
      .to(curtain.current, { opacity: 1, duration: FADE_TIME, ease: 'power2.in' }, `>${LINE_TIME}`)
      .call(() => useGameStore.getState().returnToTitle(), [], `>${DARK_HOLD}`)
    return () => {
      timeline.kill()
    }
  }, [finale])

  return <div ref={curtain} className="finale-curtain" aria-hidden="true" />
}
