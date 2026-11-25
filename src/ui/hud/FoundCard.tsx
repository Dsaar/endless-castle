import { useFigureStore } from '../../state/useFigureStore'
import { FIGURES } from '../../world/figures'
import Crossfade from '../Crossfade'

/** Seconds to fade the card in or out (or one card into the next). */
const CARD_FADE = 0.8

/**
 * Center: the FOUND card, when a hidden figure is found or clicked again. Its number in a
 * vermilion circle like its HUD circle, its name and its kanji name. Goes by itself after
 * CARD_DURATION (`useFigureStore.showCard`); never takes the pointer.
 */
export default function FoundCard() {
  const card = useFigureStore((s) => s.card)
  const figure = card ? FIGURES[card.index] : null

  return (
    <div className="hud__found" role="status">
      <Crossfade contentKey={card?.n ?? 0} duration={CARD_FADE} className="hud__found-fade">
        {figure && (
          <div className="hud__found-card">
            <p className="label hud__found-label">Found</p>
            <p className="hud__found-number">
              <span className="hud__visually-hidden">Number </span>
              {figure.number}
            </p>
            <h2 className="hud__found-name">{figure.name}</h2>
            <p className="kanji hud__found-kanji" lang="ja">
              {figure.kanji}
            </p>
          </div>
        )}
      </Crossfade>
    </div>
  )
}
