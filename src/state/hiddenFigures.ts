import { FIGURES } from '../world/figures'
import { allFound, useFigureStore } from './useFigureStore'
import { useGameStore } from './useGameStore'
import { useSubtitleStore } from './useSubtitleStore'

/** Seconds a figure's line stays up. */
const LINE_DURATION = 5

/** Shows figure `index`'s card and has it say its next line. */
function present(index: number) {
  const figures = useFigureStore.getState()
  figures.showCard(index)
  const line = FIGURES[index].lines[figures.nextLine(index)]
  useSubtitleStore.getState().showSubtitle(line.en, line.ja, LINE_DURATION)
}

/**
 * A figure has been found (looked at long enough, or clicked): fill its circle, save, show the
 * FOUND card and play its first line. The sixth one starts the finale (`FinaleOverlay` waits
 * for the card before the lights turn). Ignored if it was already found, or during the finale.
 */
export function discoverFigure(index: number) {
  if (useGameStore.getState().finale) return
  if (!useFigureStore.getState().markFound(index)) return
  present(index)
  if (allFound(useFigureStore.getState().found)) useGameStore.getState().startFinale()
}

/** A figure already found is clicked: its card again, and its next line. */
export function revisitFigure(index: number) {
  if (useGameStore.getState().finale) return
  present(index)
}

/** A click on figure `index`: finds it, or shows its card again if it was found before. */
export function clickFigure(index: number) {
  if (useFigureStore.getState().found[index]) revisitFigure(index)
  else discoverFigure(index)
}
