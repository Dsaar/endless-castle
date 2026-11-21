export type Vec3 = [number, number, number]

/** Placement shared by every kit piece. `size` is declared per piece, since its meaning varies. */
export interface KitTransform {
  position?: Vec3
  /** Euler angles in radians, XYZ order. */
  rotation?: Vec3
  /** Varies the grain offsets between copies of the same piece. Defaults to a hash of `position`. */
  seed?: number
}

/**
 * Where one copy of an instanced piece goes. `yaw` turns it about Y (0 keeps local -Z
 * pointing to world -Z, positive turns toward -X), then `pitch` tilts it about its own X
 * (positive lifts its -Z end). `scale` stretches the shared geometry.
 */
export interface InstanceTransform {
  position: Vec3
  yaw?: number
  pitch?: number
  scale?: Vec3
}

/** One box of a `MergedBoxes` group: same yaw / pitch convention as `InstanceTransform`. */
export interface BoxSpec {
  /** [x, y, z] in meters, before rotation. */
  size: Vec3
  /** Center. */
  position: Vec3
  yaw?: number
  pitch?: number
  /** Axis the grain runs along (0 = x, 1 = y, 2 = z). Defaults to the longest. */
  grain?: 0 | 1 | 2
}
