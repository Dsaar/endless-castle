import { useEffect, useLayoutEffect, useRef, useState, type ComponentType, type KeyboardEvent } from 'react'
import gsap from 'gsap'
import { useGameStore } from '../state/useGameStore'
import CastlePanel from './guide/CastlePanel'
import { GUIDE_TABS, type GuideTabId } from './guide/content'
import HiddenOnesPanel from './guide/HiddenOnesPanel'
import InkStamp from './guide/InkStamp'
import MovingPanel from './guide/MovingPanel'
import SignsPanel from './guide/SignsPanel'
import './GuideScroll.css'

/** Seconds for the rollers to unroll the paper (and to roll it back up). */
const UNROLL = 0.9
/** How far the roller grain turns while unrolling (px of background travel). */
const ROLL_TRAVEL = 140

const PANELS: Record<GuideTabId, ComponentType> = {
  castle: CastlePanel,
  moving: MovingPanel,
  hidden: HiddenOnesPanel,
  signs: SignsPanel,
}

const FOCUSABLE = 'button:not([disabled]):not([tabindex="-1"]), [tabindex="0"]'

/**
 * The guide: a hanging paper scroll that unrolls from the middle. Opens by itself the first
 * time the player tries to walk at the gate, and later from the GUIDE button. While it is
 * open, player input is paused and the canvas is dimmed (see `guideOpen` in the game store).
 * ESC or ACCEPT THE SUMMONS rolls it back up.
 */
export default function GuideScroll() {
  const open = useGameStore((s) => s.guideOpen)
  const closeGuide = useGameStore((s) => s.closeGuide)
  // Stays mounted while the roll-up plays after `open` turns false.
  const [mounted, setMounted] = useState(open)
  const [tab, setTab] = useState<GuideTabId>('castle')
  if (open && !mounted) setMounted(true)

  const rootRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef(new Map<GuideTabId, HTMLButtonElement>())
  const returnFocusRef = useRef<HTMLElement | null>(null)

  // Rolled up, before the first paint: rollers together in the middle, paper clipped away.
  useLayoutEffect(() => {
    if (!mounted) return
    const half = paperRef.current!.offsetHeight / 2
    gsap.set(rootRef.current, { opacity: 0 })
    gsap.set(topRef.current, { y: half, '--roll': '0px' })
    gsap.set(bottomRef.current, { y: -half, '--roll': '0px' })
    // `--unrolled` (0 to 1) drives the paper's clip-path in CSS; tweening `inset()` strings directly is unreliable.
    gsap.set(paperRef.current, { '--unrolled': 0 })
  }, [mounted])

  // Unroll on open, roll back up on close. Each starts from wherever the last one stopped.
  useEffect(() => {
    if (!mounted) return
    const root = rootRef.current
    const top = topRef.current
    const bottom = bottomRef.current
    const paper = paperRef.current
    if (!root || !top || !bottom || !paper) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = reduced ? 0 : UNROLL
    const half = paper.offsetHeight / 2
    const tl = gsap.timeline({ defaults: { duration, ease: 'power2.inOut' } })

    if (open) {
      if (!root.contains(document.activeElement)) {
        returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      }
      root.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus({ preventScroll: true })
      tl.to(root, { opacity: 1, duration: reduced ? 0.2 : 0.35, ease: 'power1.out' }, 0)
        .to(top, { y: 0, '--roll': `${ROLL_TRAVEL}px` }, 0)
        .to(bottom, { y: 0, '--roll': `${-ROLL_TRAVEL}px` }, 0)
        .to(paper, { '--unrolled': 1 }, 0)
    } else {
      // Give focus back (the GUIDE button, if that's what opened it), or let it fall to the page.
      const back = returnFocusRef.current
      if (back?.isConnected && back !== document.body) back.focus({ preventScroll: true })
      else if (root.contains(document.activeElement)) (document.activeElement as HTMLElement).blur()
      tl.to(top, { y: half, '--roll': '0px' }, 0)
        .to(bottom, { y: -half, '--roll': '0px' }, 0)
        .to(paper, { '--unrolled': 0 }, 0)
        .to(root, { opacity: 0, duration: reduced ? 0.2 : 0.3, ease: 'power1.in' }, reduced ? 0 : '-=0.3')
        .call(() => setMounted(false))
    }
    return () => {
      tl.kill()
    }
  }, [open, mounted])

  // ESC rolls it up.
  useEffect(() => {
    if (!open) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      closeGuide()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closeGuide])

  // A new tab starts at the top.
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 })
  }, [tab])

  if (!mounted) return null

  const selectTab = (id: GuideTabId) => {
    setTab(id)
    tabRefs.current.get(id)?.focus()
  }

  // Tabs: ← → move between them, Home / End jump to the ends (they select as they focus).
  const onTabKeyDown = (e: KeyboardEvent) => {
    const i = GUIDE_TABS.findIndex((t) => t.id === tab)
    const last = GUIDE_TABS.length - 1
    let next = -1
    if (e.key === 'ArrowRight') next = i === last ? 0 : i + 1
    else if (e.key === 'ArrowLeft') next = i === 0 ? last : i - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next < 0) return
    e.preventDefault()
    selectTab(GUIDE_TABS[next].id)
  }

  // Keep Tab focus inside the scroll while it is open.
  const onRootKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !rootRef.current) return
    const items = Array.from(rootRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const Panel = PANELS[tab]

  return (
    <div
      ref={rootRef}
      className={open ? 'guide' : 'guide guide--closing'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-title"
      onKeyDown={onRootKeyDown}
    >
      <div className="guide__scroll">
        <div ref={topRef} className="guide__roller guide__roller--top">
          <svg className="guide__cord" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
            <path d="M6 40 L50 3 L94 40" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="guide__nail" aria-hidden="true" />
          <span className="guide__wood" />
          <span className="guide__cap guide__cap--left" />
          <span className="guide__cap guide__cap--right" />
        </div>

        <div ref={paperRef} className="guide__paper">
          <div className="guide__stamps" aria-hidden="true">
            <InkStamp glyph="城" seed={3} className="guide__stamp guide__stamp--large" />
            <InkStamp glyph="招" seed={11} className="guide__stamp guide__stamp--small" />
          </div>

          <header className="guide__header">
            <h2 id="guide-title" className="guide__title">
              <span className="kanji guide__kanji" lang="ja">
                無限城
              </span>
              <span className="label guide__subtitle">The Endless Castle · A Guide</span>
            </h2>
          </header>

          <div className="guide__tabs" role="tablist" aria-label="Guide sections" onKeyDown={onTabKeyDown}>
            {GUIDE_TABS.map(({ id, label }) => (
              <button
                key={id}
                ref={(el) => {
                  if (el) tabRefs.current.set(id, el)
                  else tabRefs.current.delete(id)
                }}
                type="button"
                role="tab"
                id={`guide-tab-${id}`}
                aria-selected={tab === id}
                aria-controls="guide-panel"
                tabIndex={tab === id ? 0 : -1}
                className="label guide__tab"
                onClick={() => selectTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div
            ref={panelRef}
            id="guide-panel"
            className="guide__panel"
            role="tabpanel"
            aria-labelledby={`guide-tab-${tab}`}
            tabIndex={0}
          >
            <div key={tab} className="guide__panel-body">
              <Panel />
            </div>
          </div>

          <footer className="guide__footer">
            <button type="button" className="label guide__accept" onClick={closeGuide}>
              Accept the summons
            </button>
          </footer>
        </div>

        <div ref={bottomRef} className="guide__roller guide__roller--bottom">
          <span className="guide__wood" />
          <span className="guide__cap guide__cap--left" />
          <span className="guide__cap guide__cap--right" />
        </div>
      </div>
    </div>
  )
}
