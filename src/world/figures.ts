import type { RandomSegmentKind } from './segments/registry'

/**
 * The six hidden figures: who they are, where they can appear, and what they say.
 *
 * Names, kanji and lines are TODO placeholders, to be replaced with original characters.
 * `area` decides where a figure is placed (see `world/spawns/spots.ts`); each area hosts at
 * most one figure. `pose` only picks the placeholder silhouette (`scene/figures/silhouettes.ts`).
 */

/** The area types that have a hiding place worked out for them. */
export type FigureArea = Extract<RandomSegmentKind, 'threshold' | 'walkway' | 'gallery' | 'junction' | 'stairwell' | 'abyss'>

/** Placeholder silhouettes: robed figures in different poses. */
export type FigurePose = 'standing' | 'kasa' | 'staff' | 'reaching' | 'bowed' | 'parasol'

export interface FigureLine {
  en: string
  /** The Japanese under the English. */
  ja: string
}

export interface FigureData {
  /** Stable id, used to save progress. */
  id: string
  /** 1 to 6: its circle on the HUD and its slot in the guide. */
  number: number
  name: string
  kanji: string
  area: FigureArea
  pose: FigurePose
  /** Said in turn: the first when it is found, the next each time it is clicked again. */
  lines: readonly [FigureLine, FigureLine, FigureLine]
}

/** A placeholder line, until the real ones are written. */
function todoLine(figure: number, line: number): FigureLine {
  return { en: `TODO: figure ${figure}, line ${line}`, ja: `（未定 ${figure}-${line}）` }
}

function todoLines(figure: number): FigureData['lines'] {
  return [todoLine(figure, 1), todoLine(figure, 2), todoLine(figure, 3)]
}

export const FIGURES: readonly FigureData[] = [
  // TODO: name, kanji and lines for each figure.
  { id: 'figure-1', number: 1, name: 'TODO Name One', kanji: '未定一', area: 'threshold', pose: 'standing', lines: todoLines(1) },
  { id: 'figure-2', number: 2, name: 'TODO Name Two', kanji: '未定二', area: 'walkway', pose: 'kasa', lines: todoLines(2) },
  { id: 'figure-3', number: 3, name: 'TODO Name Three', kanji: '未定三', area: 'gallery', pose: 'parasol', lines: todoLines(3) },
  { id: 'figure-4', number: 4, name: 'TODO Name Four', kanji: '未定四', area: 'junction', pose: 'bowed', lines: todoLines(4) },
  { id: 'figure-5', number: 5, name: 'TODO Name Five', kanji: '未定五', area: 'stairwell', pose: 'reaching', lines: todoLines(5) },
  { id: 'figure-6', number: 6, name: 'TODO Name Six', kanji: '未定六', area: 'abyss', pose: 'staff', lines: todoLines(6) },
]

/** The finale's last line, once all six are found. TODO: write it. */
export const FINALE_LINE: FigureLine = { en: 'TODO: the final line', ja: '（未定）' }

/** Which figure (index into FIGURES) can appear in each area type, if any. */
export const FIGURE_BY_AREA: Partial<Record<RandomSegmentKind, number>> = {}

FIGURES.forEach((figure, index) => {
  if (FIGURE_BY_AREA[figure.area] !== undefined) throw new Error(`Two figures share the area "${figure.area}"`)
  if (figure.number !== index + 1) throw new Error(`Figure ${figure.id} is number ${figure.number}, expected ${index + 1}`)
  FIGURE_BY_AREA[figure.area] = index
})
