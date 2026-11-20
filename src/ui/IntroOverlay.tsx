import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGameStore } from '../state/useGameStore'
import { usePlayerStore } from '../state/usePlayerStore'
import './IntroOverlay.css'

/** Meters walked before the intro text fades away for good. */
const DISMISS_AFTER = 0.6

/**
 * Text over the gate once the intro camera has arrived: "You have been summoned." fades
 * in, then a small "Scroll to enter" with a pulsing line beneath it. Once the player starts
 * walking, it fades out and stays gone.
 */
export default function IntroOverlay() {
  const introComplete = useGameStore((s) => s.introComplete)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!introComplete) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(['.intro-overlay__title', '.intro-overlay__hint'], { autoAlpha: 1 })
        return
      }
      gsap
        .timeline()
        .fromTo(
          '.intro-overlay__title',
          { autoAlpha: 0, y: 6, letterSpacing: '0.28em' },
          { autoAlpha: 1, y: 0, letterSpacing: '0.34em', duration: 2.4, ease: 'power2.out' },
        )
        .fromTo('.intro-overlay__hint', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4, ease: 'power1.out' }, '-=0.9')
    }, rootRef)
    return () => ctx.revert()
  }, [introComplete])

  useEffect(() => {
    let tween: gsap.core.Tween | null = null
    const unsubscribe = usePlayerStore.subscribe((s) => {
      if (tween || s.progress < DISMISS_AFTER) return
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      tween = gsap.to(rootRef.current, { autoAlpha: 0, duration: reduced ? 0 : 1.4, ease: 'power1.out' })
      unsubscribe()
    })
    return () => {
      unsubscribe()
      tween?.kill()
    }
  }, [])

  return (
    <div ref={rootRef} className="intro-overlay" aria-live="polite">
      <h2 className="intro-overlay__title">You have been summoned.</h2>
      <div className="intro-overlay__hint">
        <span className="label">Scroll to enter</span>
        <span className="intro-overlay__line" aria-hidden="true" />
      </div>
    </div>
  )
}
