import {
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  type BufferAttribute,
  type BufferGeometry,
  type Material,
  type Matrix4,
} from 'three'

/** Seconds far enough ahead to mean "never". */
export const NEVER = 1e9

/**
 * Hands out numbered slots, lowest free first, so the instanced meshes only draw up to the
 * highest one in use.
 */
export class SlotAllocator {
  readonly capacity: number
  private readonly used: Uint8Array
  /** Highest slot in use, plus one. */
  top = 0
  inUse = 0

  constructor(capacity: number) {
    this.capacity = capacity
    this.used = new Uint8Array(capacity)
  }

  /** A free slot, or -1 when they are all taken. */
  alloc() {
    for (let i = 0; i < this.capacity; i++) {
      if (this.used[i]) continue
      this.used[i] = 1
      this.top = Math.max(this.top, i + 1)
      this.inUse++
      return i
    }
    return -1
  }

  release(slot: number) {
    if (!this.used[slot]) return
    this.used[slot] = 0
    this.inUse--
    while (this.top > 0 && !this.used[this.top - 1]) this.top--
  }
}

/**
 * One InstancedMesh cut into fixed-size blocks, one block per slot: a piece writes its
 * instances into its slot's block, and the unused rest of the block stays collapsed (a zero
 * matrix draws nothing). Writing a block uploads just that block (`addUpdateRange`), so
 * spawning a piece costs a few small uploads instead of the whole buffer.
 *
 * Besides the matrix and color, every instance carries the distant-castle attributes
 * `aPivot` and `aMotion` (see `distantMaterial.ts`), the same for a whole block.
 */
export class InstanceBank {
  readonly mesh: InstancedMesh
  private readonly block: number
  private readonly matrices: Float32Array
  private readonly colors: Float32Array
  private readonly pivot: InstancedBufferAttribute
  private readonly motion: InstancedBufferAttribute
  private cursor = 0
  private end = 0
  private slot = -1
  /** While true, writes skip the per-block upload ranges; `flush` then uploads everything once. */
  private bulk = false

  constructor(geometry: BufferGeometry, material: Material, slots: number, block: number) {
    const count = slots * block
    this.block = block
    this.pivot = new InstancedBufferAttribute(new Float32Array(count * 4), 4).setUsage(DynamicDrawUsage)
    this.motion = new InstancedBufferAttribute(new Float32Array(count * 4), 4).setUsage(DynamicDrawUsage)
    geometry.setAttribute('aPivot', this.pivot)
    geometry.setAttribute('aMotion', this.motion)

    const mesh = new InstancedMesh(geometry, material, count)
    mesh.instanceMatrix.setUsage(DynamicDrawUsage)
    this.matrices = mesh.instanceMatrix.array as Float32Array
    // InstancedMesh starts every instance at identity; collapse them all.
    this.matrices.fill(0)
    mesh.instanceColor = new InstancedBufferAttribute(new Float32Array(count * 3), 3).setUsage(DynamicDrawUsage)
    this.colors = mesh.instanceColor.array as Float32Array
    mesh.count = 0
    // The ring surrounds the camera, so its bounds always would too.
    mesh.frustumCulled = false
    mesh.matrixAutoUpdate = false
    this.mesh = mesh
  }

  /** Draw slots 0 … top - 1. */
  setTop(top: number) {
    this.mesh.count = top * this.block
  }

  /** Start writing `slot`'s block. Its instances share the pivot, life and motion given here. */
  begin(slot: number, pivotX: number, pivotZ: number, born: number, spin: number, drift: number, heading: number, phase: number) {
    this.slot = slot
    this.cursor = slot * this.block
    this.end = this.cursor + this.block
    const p = this.pivot.array as Float32Array
    const m = this.motion.array as Float32Array
    for (let i = this.cursor; i < this.end; i++) {
      p[i * 4] = pivotX
      p[i * 4 + 1] = pivotZ
      p[i * 4 + 2] = born
      p[i * 4 + 3] = NEVER
      m[i * 4] = spin
      m[i * 4 + 1] = drift
      m[i * 4 + 2] = heading
      m[i * 4 + 3] = phase
    }
  }

  /** Add one instance to the block being written. Ignored once the block is full. */
  push(matrix: Matrix4, r: number, g: number, b: number) {
    if (this.cursor >= this.end) return
    matrix.toArray(this.matrices, this.cursor * 16)
    const c = this.colors
    c[this.cursor * 3] = r
    c[this.cursor * 3 + 1] = g
    c[this.cursor * 3 + 2] = b
    this.cursor++
  }

  /** Finish the block: collapse what's left of it and queue its upload. */
  finish() {
    this.matrices.fill(0, this.cursor * 16, this.end * 16)
    const start = this.slot * this.block
    this.mark(this.mesh.instanceMatrix, start, 16)
    this.mark(this.mesh.instanceColor!, start, 3)
    this.mark(this.pivot, start, 4)
    this.mark(this.motion, start, 4)
  }

  /** Collapse a slot's whole block. */
  clear(slot: number) {
    const start = slot * this.block
    this.matrices.fill(0, start * 16, (start + this.block) * 16)
    this.mark(this.mesh.instanceMatrix, start, 16)
  }

  /** Fade a slot's block out from now (`at` is when it has gone). */
  setDies(slot: number, at: number) {
    const p = this.pivot.array as Float32Array
    const start = slot * this.block
    for (let i = start; i < start + this.block; i++) p[i * 4 + 3] = at
    this.mark(this.pivot, start, 4)
  }

  beginBulk() {
    this.bulk = true
  }

  /** End a bulk write: upload every buffer in full, once. */
  flush() {
    this.bulk = false
    for (const attribute of [this.mesh.instanceMatrix, this.mesh.instanceColor!, this.pivot, this.motion]) {
      attribute.clearUpdateRanges()
      attribute.needsUpdate = true
    }
  }

  dispose() {
    this.mesh.geometry.dispose()
    this.mesh.dispose()
  }

  private mark(attribute: BufferAttribute, start: number, itemSize: number) {
    if (this.bulk) return
    attribute.addUpdateRange(start * itemSize, this.block * itemSize)
    attribute.needsUpdate = true
  }
}
