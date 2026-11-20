import { CatmullRomCurve3, Vector3 } from 'three'
import { GATE_PATH_POINTS } from './layout'

/**
 * The walk through the opening, at floor level: from the bridge head, where the intro camera
 * stops, straight across the bridge to just in front of the closed doors.
 */
export const GATE_PATH = new CatmullRomCurve3(
  GATE_PATH_POINTS.map(([x, y, z]) => new Vector3(x, y, z)),
  false,
  'centripetal',
)
