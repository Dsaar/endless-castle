import { useEffect } from 'react'
import { KIT_EXHIBITS } from '../scene/kitExhibits'
import './KitOverlay.css'

interface KitOverlayProps {
  focus: number
  onFocus: (index: number) => void
}

/** HTML overlay for the ?kit dev view: a heading, controls hint and one button per exhibit. */
export default function KitOverlay({ focus, onFocus }: KitOverlayProps) {
  // ← / → step through the exhibits.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onFocus(Math.min(KIT_EXHIBITS.length - 1, focus + 1))
      else if (e.key === 'ArrowLeft') onFocus(Math.max(0, focus - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focus, onFocus])

  return (
    <div className="kit-overlay">
      <header className="kit-overlay__header">
        <p className="label kit-overlay__title">Building kit</p>
        <p className="kit-overlay__hint">Drag to orbit · right-drag to pan · scroll to zoom · ← → to step</p>
      </header>
      <nav className="kit-overlay__nav" aria-label="Kit pieces">
        {KIT_EXHIBITS.map((exhibit, i) => (
          <button
            key={exhibit.name}
            type="button"
            className="label kit-overlay__item"
            aria-current={i === focus ? 'true' : undefined}
            onClick={() => onFocus(i)}
          >
            {exhibit.name}
          </button>
        ))}
      </nav>
    </div>
  )
}
