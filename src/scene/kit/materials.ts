import { Color, DoubleSide, MeshStandardMaterial, type WebGLProgramParametersWithUniforms } from 'three'
import { mixPalette } from '../../lib/color'
import { palette } from '../../lib/palette'
import { getPaperTexture, getRoofTileTexture, getTatamiTexture, getWoodTexture } from './textures'

/**
 * Shared materials for the building kit. Each is created once, on first use, and every
 * piece reuses it: same material means same shader program and fewer state changes.
 * Never dispose these from a component.
 */

/** Multiplier for materials whose color comes entirely from their texture. */
const NEUTRAL = new Color(1, 1, 1)

function lazy<T>(create: () => T): () => T {
  let value: T | null = null
  return () => (value ??= create())
}

/** Cedar for beams, posts, frames and rails. Matte. */
export const getWoodMaterial = lazy(
  () =>
    new MeshStandardMaterial({
      name: 'kit/wood',
      color: NEUTRAL,
      map: getWoodTexture(),
      bumpMap: getWoodTexture(),
      bumpScale: 0.6,
      roughness: 0.72,
      metalness: 0,
    }),
)

/** Polished floorboards: same grain, low roughness so lanterns leave hot spots. */
export const getFloorMaterial = lazy(
  () =>
    new MeshStandardMaterial({
      name: 'kit/floor',
      color: NEUTRAL,
      map: getWoodTexture(),
      bumpMap: getWoodTexture(),
      bumpScale: 0.35,
      roughness: 0.3,
      metalness: 0,
    }),
)

/** The dark underlay that shows through gaps between planks and mats. */
export const getUnderlayMaterial = lazy(
  () => new MeshStandardMaterial({ name: 'kit/underlay', color: palette.void, roughness: 1 }),
)

/** Lit shoji paper: cream, emissive, strong enough to bloom. */
export const getShojiLitMaterial = lazy(
  () =>
    new MeshStandardMaterial({
      name: 'kit/shoji-lit',
      color: NEUTRAL,
      map: getPaperTexture(),
      emissive: NEUTRAL,
      emissiveMap: getPaperTexture(),
      emissiveIntensity: 0.95,
      roughness: 0.9,
      side: DoubleSide,
    }),
)

/** Unlit shoji paper: only a faint residual glow, mostly lit by the scene. */
export const getShojiDarkMaterial = lazy(
  () =>
    new MeshStandardMaterial({
      name: 'kit/shoji-dark',
      color: NEUTRAL,
      map: getPaperTexture(),
      emissive: NEUTRAL,
      emissiveMap: getPaperTexture(),
      emissiveIntensity: 0.04,
      roughness: 0.9,
      side: DoubleSide,
    }),
)

/** Lantern paper base intensity. Lanterns that flicker clone this material. */
export const LANTERN_PAPER_INTENSITY = 2.4

/** Lantern paper: the paper texture glowing in lantern amber. */
export const getLanternPaperMaterial = lazy(
  () =>
    new MeshStandardMaterial({
      name: 'kit/lantern-paper',
      color: NEUTRAL,
      map: getPaperTexture(),
      emissive: palette.lantern,
      emissiveMap: getPaperTexture(),
      emissiveIntensity: LANTERN_PAPER_INTENSITY,
      roughness: 0.9,
    }),
)

/** Tatami rush surface. */
export const getTatamiMaterial = lazy(
  () =>
    new MeshStandardMaterial({
      name: 'kit/tatami',
      color: NEUTRAL,
      map: getTatamiTexture(),
      bumpMap: getTatamiTexture(),
      bumpScale: 0.4,
      roughness: 0.82,
    }),
)

/** Tatami border cloth (heri): almost black, with a slight sheen. */
export const getTatamiBorderMaterial = lazy(
  () =>
    new MeshStandardMaterial({
      name: 'kit/tatami-border',
      color: mixPalette('void', 'cedarDark', 0.25),
      roughness: 0.55,
    }),
)

/** Fired roof tile: warm charcoal with rounded rows. */
export const getRoofTileMaterial = lazy(
  () =>
    new MeshStandardMaterial({
      name: 'kit/roof-tile',
      color: NEUTRAL,
      map: getRoofTileTexture(),
      bumpMap: getRoofTileTexture(),
      bumpScale: 2,
      roughness: 0.55,
      metalness: 0.1,
    }),
)

/** Glowing tatami: the same rush surface, faintly self-lit (the Threshold's runner). */
export const TATAMI_GLOW_INTENSITY = 0.3

export const getTatamiGlowMaterial = lazy(
  () =>
    new MeshStandardMaterial({
      name: 'kit/tatami-glow',
      color: NEUTRAL,
      map: getTatamiTexture(),
      bumpMap: getTatamiTexture(),
      bumpScale: 0.4,
      emissive: NEUTRAL,
      emissiveMap: getTatamiTexture(),
      emissiveIntensity: TATAMI_GLOW_INTENSITY,
      roughness: 0.82,
    }),
)

/** Vermilion lacquer, the one accent: glossy, with a hint of the grain underneath. Use sparingly. */
export const getLacquerMaterial = lazy(
  () =>
    new MeshStandardMaterial({
      name: 'kit/lacquer',
      color: palette.vermilion,
      bumpMap: getWoodTexture(),
      bumpScale: 0.15,
      roughness: 0.32,
      metalness: 0,
    }),
)

/** Vermilion silk for a hanging scroll's mounting: matte, with the paper's fibres. */
export const getScrollClothMaterial = lazy(
  () =>
    new MeshStandardMaterial({
      name: 'kit/scroll-cloth',
      color: palette.vermilion,
      map: getPaperTexture(),
      roughness: 0.85,
      side: DoubleSide,
    }),
)

/** Earthen plaster (tsuchikabe) for solid room walls: warm, matte, faintly fibrous. */
export const getPlasterMaterial = lazy(
  () =>
    new MeshStandardMaterial({
      name: 'kit/plaster',
      color: mixPalette('shoji', 'cedarDark', 0.5),
      map: getPaperTexture(),
      roughness: 0.95,
    }),
)

/**
 * Lantern paper for instanced lanterns. Each instance's glow comes from a per-instance
 * `instanceGlow` attribute (see `LanternInstances`), so one material and one draw call
 * serve a whole row of lanterns flickering out of step. Only use it on instanced meshes
 * that carry that attribute.
 */
export const getInstancedLanternPaperMaterial = lazy(() => {
  const material = getLanternPaperMaterial().clone()
  material.name = 'kit/lantern-paper-instanced'
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    shader.vertexShader =
      'attribute float instanceGlow;\nvarying float vGlow;\n' +
      shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvGlow = instanceGlow;')
    shader.fragmentShader =
      'varying float vGlow;\n' +
      shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vGlow;',
      )
  }
  material.customProgramCacheKey = () => 'kit/lantern-paper-instanced'
  return material
})
