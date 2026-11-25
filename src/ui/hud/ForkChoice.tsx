import { useState } from 'react'
import { useForkStore, type WaitingFork } from '../../state/useForkStore'
import type { BranchChoice } from '../../world/segment'

interface ChoiceButton {
  choice: BranchChoice
  glyph: string
  /** The key that does the same, shown under the button. */
  key: string
  label: string
}

const TURN: readonly ChoiceButton[] = [
  { choice: 'left', glyph: '←', key: 'A', label: 'Go left' },
  { choice: 'straight', glyph: '●', key: 'W', label: 'Go straight on' },
  { choice: 'right', glyph: '→', key: 'D', label: 'Go right' },
]
const STAIRS: readonly ChoiceButton[] = [
  { choice: 'up', glyph: '↑', key: 'E', label: 'Climb the stairs' },
  { choice: 'down', glyph: '↓', key: 'Q', label: 'Go down the stairs' },
]

/**
 * Bottom center, while the player stands at a fork: round buttons with a thin bronze outline,
 * ← ● → in a hall and ↑ ↓ on the stairs, each with its key under it. Fades in on arrival and
 * out once a way is chosen (or the player walks back). Keeps the last fork's buttons while
 * fading out, so they don't change under the fade.
 */
export default function ForkChoice() {
  const waiting = useForkStore((s) => s.waiting)
  // Keep the last fork's buttons for the fade out (updated while rendering, not in an effect).
  const [shown, setShown] = useState<WaitingFork | null>(waiting)
  if (waiting && waiting !== shown) setShown(waiting)

  const buttons = shown?.picker === 'stairs' ? STAIRS : TURN
  const open = waiting !== null
  return (
    <nav
      className={open ? 'hud__fork hud__fork--shown' : 'hud__fork'}
      aria-label="Choose a way"
      aria-hidden={!open}
      inert={!open}
    >
      {buttons.map((b) => (
        <div key={b.choice} className="hud__fork-option">
          <button
            type="button"
            className={`hud__fork-button hud__fork-button--${b.choice}`}
            aria-label={`${b.label} (${b.key})`}
            onClick={() => useForkStore.getState().choose(b.choice)}
          >
            <span aria-hidden="true">{b.glyph}</span>
          </button>
          <span className="label hud__fork-key" aria-hidden="true">
            {b.key}
          </span>
        </div>
      ))}
    </nav>
  )
}
