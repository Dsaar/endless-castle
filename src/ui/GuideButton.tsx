import { useGameStore } from '../state/useGameStore'
import './GuideButton.css'

/** Reopens the guide scroll. Appears once the guide has opened by itself the first time. */
export default function GuideButton() {
  const seen = useGameStore((s) => s.guideSeen)
  const open = useGameStore((s) => s.guideOpen)
  const openGuide = useGameStore((s) => s.openGuide)
  if (!seen) return null

  return (
    <button
      type="button"
      className="label guide-button"
      aria-haspopup="dialog"
      aria-expanded={open}
      // Covered by the scroll while it's open; keep it out of the tab order too.
      inert={open}
      onClick={openGuide}
    >
      Guide
    </button>
  )
}
