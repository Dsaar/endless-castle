import { FIGURE_COUNT, useFigureStore } from '../../state/useFigureStore'

/** Slot numbers as the HUD shows them, counting down: 6 5 4 3 2 1. */
const SLOTS = Array.from({ length: FIGURE_COUNT }, (_, i) => FIGURE_COUNT - i)

/** Top left: the title, the hidden-ones count, and six circles that fill vermilion when found. */
export default function HudHeader() {
  const found = useFigureStore((s) => s.found)
  const count = found.reduce((n, f) => (f ? n + 1 : n), 0)

  return (
    <header className="hud__panel hud__header">
      <p className="label hud__title">
        The Endless Castle{' '}
        <span className="kanji" lang="ja">
          無限城
        </span>
      </p>
      <p className="label hud__count">
        Hidden Ones{' '}
        <span className="hud__count-value">
          {count} / {FIGURE_COUNT}
        </span>
      </p>
      <ol className="hud__figures" aria-hidden="true">
        {SLOTS.map((n) => (
          <li key={n} className={found[n - 1] ? 'hud__figure hud__figure--found' : 'hud__figure'}>
            {n}
          </li>
        ))}
      </ol>
    </header>
  )
}
