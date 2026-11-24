import type { PagodaProps } from '../scene/Pagoda'
import type { Vec3 } from '../scene/kit/types'

export interface PagodaPlacement extends PagodaProps {
  position: Vec3
}

/** The two distant pagodas either side of the Gate. */
export const PAGODAS: readonly PagodaPlacement[] = [
  { position: [-44, -12, -82], rotationY: 0.38, seed: 7 },
  { position: [47, -14, -90], rotationY: -0.3, baseWidth: 12, tierHeight: 6.4, seed: 19 },
]

/**
 * The space a pagoda takes, spire and eaves included, for scenery that must keep clear of it
 * (the distant castle): a vertical cylinder around its base, `PAGODA_CLEARANCE` wide, from
 * a little under the base to `PAGODA_HEIGHT` above it.
 */
export const PAGODA_CLEARANCE = 16
export const PAGODA_HEIGHT = 46
