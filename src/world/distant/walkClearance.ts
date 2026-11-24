import type { Vector3 } from 'three'
import type { WorldGenerator } from '../WorldGenerator'

/** Below the walk: piers hang up to 18 m, pavilions float a little lower. */
const CLEAR_BELOW = 26
/**
 * Above it: roofs, the gate house, and the lower half of the walkway's suspension cords
 * (2 cm thick: higher up they are lost in the fog before anything distant shows).
 */
const CLEAR_ABOVE = 20
/** A segment whose ends differ in height by more than this is a drop (the Fall). */
const DROP = 10
/**
 * Everything in the Fall's shaft stays within about 30 m of the line the camera falls along;
 * this keeps the distant castle clear of it (from the middle of that line).
 */
const SHAFT_RADIUS = 40

const MAX_SLABS = 16
const MAX_SHAFTS = 4

/**
 * The space the near castle can occupy, which the distant castle must keep out of, worked out
 * from the mounted segments:
 *
 * - **slabs**: every height the walk passes through, from CLEAR_BELOW under it to CLEAR_ABOVE
 *   over it, at any distance. So the distant castle never runs into the walk however it turns.
 * - **shafts**: for a drop (the Fall), a column around the fall line from the landing to the
 *   deck, and no slab, so distant towers still stand beside the shaft and you fall past them.
 */
export class WalkClearance {
  private slabCount = 0
  private readonly slabs = new Float64Array(MAX_SLABS * 2)
  private shaftCount = 0
  /** x, z, radius, low, high per shaft. */
  private readonly shafts = new Float64Array(MAX_SHAFTS * 5)

  private nextSlabs = 0
  private readonly next = new Float64Array(MAX_SLABS * 2)
  private nextShafts = 0
  private readonly nextShaft = new Float64Array(MAX_SHAFTS * 5)

  /** Recomputes from the generator's mounted window. True when anything changed. No allocation. */
  update(generator: WorldGenerator) {
    this.nextSlabs = 0
    this.nextShafts = 0
    for (let id = generator.first; id <= generator.last; id++) {
      const s = generator.byId(id)
      if (!s) continue
      const low = Math.min(s.start.y, s.end.y)
      const high = Math.max(s.start.y, s.end.y)
      if (high - low > DROP) {
        // No slabs: the segments either side of a drop add their own while they're mounted,
        // and the column covers the deck. So once you've landed, the castle fills in above you.
        this.addShaft((s.start.x + s.end.x) / 2, (s.start.z + s.end.z) / 2, low - CLEAR_BELOW, high + CLEAR_ABOVE)
      } else {
        this.addSlab(low, high)
      }
    }

    const changed =
      this.nextSlabs !== this.slabCount ||
      this.nextShafts !== this.shaftCount ||
      !same(this.next, this.slabs, this.nextSlabs * 2) ||
      !same(this.nextShaft, this.shafts, this.nextShafts * 5)
    if (changed) {
      this.slabs.set(this.next)
      this.shafts.set(this.nextShaft)
      this.slabCount = this.nextSlabs
      this.shaftCount = this.nextShafts
    }
    return changed
  }

  /** Whether a box (center, half-size) reaches into the near castle's space. */
  blocks(center: Vector3, half: Vector3) {
    const bottom = center.y - half.y
    const top = center.y + half.y
    const s = this.slabs
    for (let i = 0; i < this.slabCount * 2; i += 2) {
      if (bottom < s[i + 1] && top > s[i]) return true
    }
    const reach = Math.max(half.x, half.z)
    const c = this.shafts
    for (let i = 0; i < this.shaftCount * 5; i += 5) {
      if (bottom < c[i + 4] && top > c[i + 3] && Math.hypot(center.x - c[i], center.z - c[i + 1]) < c[i + 2] + reach) {
        return true
      }
    }
    return false
  }

  private addSlab(low: number, high: number) {
    if (this.nextSlabs >= MAX_SLABS) return
    this.next[this.nextSlabs * 2] = low - CLEAR_BELOW
    this.next[this.nextSlabs * 2 + 1] = high + CLEAR_ABOVE
    this.nextSlabs++
  }

  private addShaft(x: number, z: number, low: number, high: number) {
    if (this.nextShafts >= MAX_SHAFTS) return
    const o = this.nextShafts * 5
    const c = this.nextShaft
    c[o] = x
    c[o + 1] = z
    c[o + 2] = SHAFT_RADIUS
    c[o + 3] = low
    c[o + 4] = high
    this.nextShafts++
  }
}

function same(a: Float64Array, b: Float64Array, count: number) {
  for (let i = 0; i < count; i++) if (a[i] !== b[i]) return false
  return true
}
