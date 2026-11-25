import type { Object3D } from 'three'

/**
 * The hidden figures mounted in the castle right now, for `FigureWatcher`'s gaze test. Each
 * `HiddenFigure` adds itself on mount and removes itself on unmount.
 *
 * Mutable module state read every frame, like `lightSources`: not a store, so nothing re-renders.
 */
export interface LiveFigure {
  /** Index into FIGURES. */
  index: number
  /** Sits at the figure's middle (FIGURE_CENTER above its feet), wherever its room has moved it. */
  anchor: Object3D
  /** Seconds it has been held near the center of the view without a break. */
  dwell: number
  /** From the camera, as of the last frame (meters). For the dev panel. */
  distance: number
}

const live: LiveFigure[] = []

export function addLiveFigure(figure: LiveFigure): () => void {
  live.push(figure)
  return () => {
    const i = live.indexOf(figure)
    if (i >= 0) live.splice(i, 1)
  }
}

/** The live list. Don't hold on to it or change it. */
export function getLiveFigures(): readonly LiveFigure[] {
  return live
}
