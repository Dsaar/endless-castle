import type { Vec3 } from './kit/types'

/** One stop along the kit view's row: what to call it and where the camera looks. */
export interface KitExhibit {
  name: string
  /** Orbit target. */
  target: Vec3
  /** Camera position relative to the target when stepping to this exhibit. */
  view: Vec3
}

/** Spacing between exhibits along X. */
export const KIT_SPACING = 5.5

const at = (i: number) => i * KIT_SPACING

export const KIT_EXHIBITS: KitExhibit[] = [
  { name: 'Wood beam', target: [at(0), 1.3, 0], view: [1.2, 0.5, 3.2] },
  { name: 'Post', target: [at(1), 1.3, 0], view: [1.2, 0.4, 3.4] },
  { name: 'Floor planks', target: [at(2), 0, 0], view: [0, 1.8, 3.4] },
  { name: 'Shoji', target: [at(3), 1, 0], view: [0.6, 0.4, 3] },
  { name: 'Lanterns', target: [at(4), 1, 0], view: [0.4, 0.3, 2.8] },
  { name: 'Railing', target: [at(5), 0.6, 0], view: [1, 0.8, 3.4] },
  { name: 'Tatami', target: [at(6), 0, 0], view: [0, 3.4, 3.4] },
  { name: 'Roof', target: [at(7) + 1, 1.4, 0], view: [4, 3, 6.5] },
]
