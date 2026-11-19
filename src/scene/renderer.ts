import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'

/** Device pixel ratio range for every canvas. */
export const CANVAS_DPR: [number, number] = [1, 2]

/**
 * WebGL settings shared by the castle and the kit view.
 * MSAA happens in the EffectComposer, so the default framebuffer doesn't need it.
 * ACES here is the fallback when post-processing is off; see PostEffects.
 */
export const GL_OPTIONS = {
  antialias: false,
  powerPreference: 'high-performance',
  toneMapping: ACESFilmicToneMapping,
  outputColorSpace: SRGBColorSpace,
} as const
