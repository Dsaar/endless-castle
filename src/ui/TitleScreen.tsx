import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { audioEngine } from '../audio/AudioEngine'
import { useGameStore } from '../state/useGameStore'
import InkEmblem from './InkEmblem'
import Smoke from './Smoke'
import './TitleScreen.css'

const FADE_IN = 2
const FADE_OUT = 1.2

interface TitleScreenProps {
  /** Called once the screen has fully faded to black. */
  onEnter: () => void
  /** Name shown bottom right as "by <author>". */
  author: string
  /** Optional handler for the CREDITS label; it renders as plain text without one. */
  onCredits?: () => void
}

export default function TitleScreen({ onEnter, author, onCredits }: TitleScreenProps) {
  const rootRef = useRef<HTMLElement>(null)
  const curtainRef = useRef<HTMLDivElement>(null)
  const ctxRef = useRef<gsap.Context | null>(null)
  const onEnterRef = useRef(onEnter)
  const [leaving, setLeaving] = useState(false)
  const setSoundEnabled = useGameStore((s) => s.setSoundEnabled)

  useEffect(() => {
    onEnterRef.current = onEnter
  }, [onEnter])

  // Intro: everything fades in over 2s while the brush stroke paints itself.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      gsap.fromTo(
        rootRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: FADE_IN, ease: 'power1.inOut' },
      )
      const reveal = '[data-enso-reveal]'
      if (reduced) gsap.set(reveal, { strokeDashoffset: 0 })
      else gsap.to(reveal, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut', delay: 0.35 })
    }, rootRef)
    ctxRef.current = ctx
    return () => {
      ctx.revert()
      ctxRef.current = null
    }
  }, [])

  const enter = (sound: boolean) => {
    if (leaving) return
    setLeaving(true)
    setSoundEnabled(sound)
    // Browsers only let sound start from a click: make and resume the audio context now.
    audioEngine.setEnabled(sound)
    audioEngine.unlock()
    ctxRef.current?.add(() => {
      gsap.to(curtainRef.current, {
        opacity: 1,
        duration: FADE_OUT,
        ease: 'power2.in',
        onComplete: () => onEnterRef.current(),
      })
    })
  }

  return (
    <section ref={rootRef} className="title-screen" aria-label="The Endless Castle" aria-busy={leaving}>
      <Smoke />
      <div className="title-screen__glow" aria-hidden="true" />

      <p className="title-screen__kanji kanji" lang="ja" aria-hidden="true">
        無限城
      </p>

      <div className="title-screen__center">
        <InkEmblem className="title-screen__emblem" />
        <h1 className="title-screen__title">The Endless Castle</h1>
        <div className="title-screen__actions">
          <button
            type="button"
            className="title-screen__enter"
            onClick={() => enter(true)}
            disabled={leaving}
            autoFocus
          >
            Enter the castle
          </button>
          <button
            type="button"
            className="title-screen__silent"
            onClick={() => enter(false)}
            disabled={leaving}
          >
            Enter in silence
          </button>
        </div>
      </div>

      <footer className="title-screen__footer">
        {onCredits ? (
          <button type="button" className="title-screen__credits label" onClick={onCredits} disabled={leaving}>
            Credits
          </button>
        ) : (
          <span className="title-screen__credits label">Credits</span>
        )}
        <span className="title-screen__author">by {author}</span>
      </footer>

      <div ref={curtainRef} className="title-screen__curtain" aria-hidden="true" />
    </section>
  )
}
