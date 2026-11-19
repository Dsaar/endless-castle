export type Vec3 = [number, number, number]

/** Placement shared by every kit piece. `size` is declared per piece, since its meaning varies. */
export interface KitTransform {
  position?: Vec3
  /** Euler angles in radians, XYZ order. */
  rotation?: Vec3
  /** Varies the grain offsets between copies of the same piece. Defaults to a hash of `position`. */
  seed?: number
}
