import { Color, SRGBColorSpace } from 'three'
import { palette, type PaletteKey } from './palette'

/**
 * Derived tones. Every color still comes from the palette: these only blend two palette
 * entries, so straw, tile grey or a darker cedar never introduce a new hex value.
 * The blend happens in linear space (three's working color space).
 */
export function mixPalette(a: PaletteKey, b: PaletteKey, t: number): Color {
  return new Color(palette[a]).lerp(new Color(palette[b]), t)
}

const scratch = { r: 0, g: 0, b: 0 }

/** A palette blend as an sRGB CSS color string, for drawing on canvas textures. */
export function mixCss(a: PaletteKey, b: PaletteKey, t: number, alpha = 1): string {
  mixPalette(a, b, t).getRGB(scratch, SRGBColorSpace)
  const r = Math.round(scratch.r * 255)
  const g = Math.round(scratch.g * 255)
  const bl = Math.round(scratch.b * 255)
  return `rgba(${r}, ${g}, ${bl}, ${alpha})`
}
