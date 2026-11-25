import type { Vector3 } from 'three'

/**
 * What `Player` walks along: a path at floor level, addressed by distance (meters) from the
 * start of the walk. The world provides it (`WorldPath`), and keeps the walkable bounds in
 * `usePlayerStore` up to date.
 */
export interface WalkPath {
  /** Writes the point `distance` meters along the walk into `target`. Must not allocate. */
  getPointAt(distance: number, target: Vector3): Vector3
  /** Floor height the stretch around `distance` starts from: stairs count their treads from it. Must not allocate. */
  baseHeightAt?(distance: number): number
}
