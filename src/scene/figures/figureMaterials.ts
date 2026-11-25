import { Color, MeshBasicMaterial } from 'three'
import type { FigurePose } from '../../world/figures'
import { getSilhouetteTexture } from './silhouettes'
import { EYES_INTENSITY, GLOW_INTENSITY } from './tuning'

const silhouettes = new Map<FigurePose, MeshBasicMaterial>()

/**
 * A pose's silhouette: unlit and unfogged, so it stays a flat dark shape against its glow and
 * whatever is lit behind it. Blended (not alpha-tested) for soft edges; it draws after its glow.
 * One per pose, shared; never dispose.
 */
export function getSilhouetteMaterial(pose: FigurePose): MeshBasicMaterial {
  let material = silhouettes.get(pose)
  if (!material) {
    material = new MeshBasicMaterial({
      name: `figure/${pose}`,
      map: getSilhouetteTexture(pose),
      transparent: true,
      fog: false,
    })
    silhouettes.set(pose, material)
  }
  return material
}

/** The red glow's brightness (its vermilion is in its texture); above 1 it blooms a little. Don't change it. */
export const GLOW_COLOR = new Color(GLOW_INTENSITY, GLOW_INTENSITY, GLOW_INTENSITY)

/** The eyes' brightness (their paper-white is in their texture): just past 1, for the faintest bloom. Don't change it. */
export const EYES_COLOR = new Color(EYES_INTENSITY, EYES_INTENSITY, EYES_INTENSITY)
