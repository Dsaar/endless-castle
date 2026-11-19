/**
 * The single source of truth for every color in Endless Castle.
 * Never hard-code a color elsewhere — import from here.
 */
export const palette = {
  /** The void. Page background, clear color and fog color. */
  void: '#030202',
  /** Cedar wood, darkest tone (shadowed beams, floorboards). */
  cedarDark: '#5A2A18',
  /** Cedar wood, lightest tone (lit edges, polished surfaces). */
  cedarLight: '#8B3A1E',
  /** Shoji paper. Used as an emissive, backlit surface. */
  shoji: '#F3DCB0',
  /** Lantern light. Point lights and warm glows. */
  lantern: '#FFB866',
  /** The one accent: vermilion. Use sparingly. */
  vermilion: '#B3241E',
  /** UI overlay text. */
  uiText: '#E9DCC6',
} as const

export type PaletteKey = keyof typeof palette

/** Exposes the palette to CSS as custom properties, e.g. `var(--color-void)`. */
export function applyPaletteToCss(root: HTMLElement = document.documentElement) {
  for (const [key, value] of Object.entries(palette)) {
    root.style.setProperty(`--color-${toKebab(key)}`, value)
  }
}

function toKebab(s: string) {
  return s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
}
