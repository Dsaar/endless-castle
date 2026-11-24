import { Color, DoubleSide, Matrix4, Quaternion, Vector3, type Material } from 'three'
import { mixPalette } from '../../lib/color'
import type { WalkClearance } from '../../world/distant/walkClearance'
import {
  CELL_HEIGHT,
  CELL_SIZE,
  designTower,
  emitStructure,
  emitWindows,
  MAX_BOXES,
  MAX_ROOFS,
  MAX_WINDOWS,
  type TowerDesign,
  type TowerSink,
} from '../../world/distant/towerDesign'
import { createCapRoof, createShadedBox, createStoryRoof, createWindowQuad } from './distantGeometry'
import { createDistantMaterial, LIFE_FADE, type DistanceFade } from './distantMaterial'
import { InstanceBank, SlotAllocator } from './InstanceBank'

/** Pieces fade in from 40 m and dissolve into the fog by 300 m. */
const RANGE: DistanceFade = { nearStart: 40, nearEnd: 75, farStart: 225, farEnd: 300 }
/** Bodies, roofs and posts only exist up close: past STRUCTURE_FADE.farEnd a piece is just its windows. */
const STRUCTURE_FADE: DistanceFade = { nearStart: 40, nearEnd: 75, farStart: 115, farEnd: 150 }
/** A piece gets its structure once its nearest point is this close (m)… */
const NEAR_IN = 152
/** …and loses it again past this. Both beyond STRUCTURE_FADE.farEnd, so it's never visible. */
const NEAR_OUT = 162

/**
 * Cells are kept while any part of them is within KEEP of the camera and created within
 * CREATE. The cell set is rebuilt every time the camera has moved REBUILD_STEP, so a cell
 * that has a piece never comes inside RANGE.farEnd unseen: CREATE ≥ farEnd + REBUILD_STEP.
 */
const REBUILD_STEP = 12
const CREATE = RANGE.farEnd + REBUILD_STEP
const KEEP = CREATE + 24

/** Most pieces alive at once, and most of them with structure. */
const MAX_PIECES = 560
const MAX_NEAR = 110

/** Per frame, at most this many pieces spawn and this many gain their structure (after the first fill). */
const SPAWN_BUDGET = 10
const STRUCTURE_BUDGET = 6

const WINDOW_BRIGHTNESS = 2.4

interface Cell {
  key: number
  design: TowerDesign | null
  /** Rebuild pass that last wanted this cell. */
  mark: number
  /** Window slot (the piece is alive), or -1. */
  slot: number
  /** Structure slot, or -1. */
  near: number
  queued: boolean
  removed: boolean
  /** Index in `live`, while alive. */
  liveIndex: number
}

interface Dying {
  slot: number
  near: number
  at: number
}

export interface DistantCastleStats {
  pieces: number
  near: number
  queued: number
  /** CPU time of the last update, and the worst over the last second (ms). */
  ms: number
  peakMs: number
}

const scratchM = new Matrix4()
const scratchOut = new Matrix4()
const scratchP = new Vector3()
const scratchS = new Vector3()
const scratchQ = new Quaternion()
const Y_AXIS = new Vector3(0, 1, 0)
const IDENTITY_Q = new Quaternion()

/**
 * The distant castle: towers and rooms floating in the void all around the camera, from
 * 40 m out to 300 m.
 *
 * Space is a 3D grid of cells (`towerDesign.ts`); each cell holds at most one piece, the same
 * one every time. As the camera moves, cells that come within range get their piece and cells
 * that leave it give theirs up, so the castle seems to go on forever in every direction while
 * only a few hundred pieces exist. Everything is drawn in four instanced meshes:
 *
 * - **windows** for every piece (far pieces are nothing else),
 * - **boxes** (stories, floor slabs, posts, finials), **roofs** and **caps** for pieces within
 *   about 150 m only.
 *
 * Pieces never move on the CPU: the drift and turning of the few moving rooms, and every
 * fade, run in the vertex shader. Per frame the CPU only rebuilds the cell set after the
 * camera has moved 12 m, writes the few pieces waiting to spawn (within a budget), and checks
 * which pieces should gain or lose their structure.
 *
 * Pieces also keep out of the near castle's space (`walkClearance.ts`), so they never run
 * into it. When that changes (segments mount and unmount), pieces now inside it fade out,
 * and pieces no longer inside it fade in.
 */
export class DistantCastleSystem {
  readonly meshes
  readonly stats: DistantCastleStats = { pieces: 0, near: 0, queued: 0, ms: 0, peakMs: 0 }

  private readonly seed: number
  private readonly windows: InstanceBank
  private readonly boxes: InstanceBank
  private readonly roofs: InstanceBank
  private readonly caps: InstanceBank
  private readonly materials: Material[]
  private readonly allBanks: readonly InstanceBank[]
  /** Everything but the windows: these share the structure slots. */
  private readonly structureBanks: readonly InstanceBank[]
  private readonly pieceSlots = new SlotAllocator(MAX_PIECES)
  private readonly nearSlots = new SlotAllocator(MAX_NEAR)

  private readonly cells = new Map<number, Cell>()
  private readonly live: Cell[] = []
  private readonly queue: Cell[] = []
  private readonly dying: Dying[] = []

  private pass = 0
  private readonly lastRebuild = new Vector3(Number.NaN, 0, 0)
  private clearance: WalkClearance | null = null
  private started = false
  private peakAge = 0

  /** The piece being written. */
  private current: TowerDesign | null = null
  private readonly windowTint = [mixPalette('lantern', 'shoji', 0), mixPalette('lantern', 'shoji', 1)]
  private readonly tint = new Color()

  constructor(seed: number) {
    this.seed = seed
    const windowMaterial = createDistantMaterial(
      { name: 'distant/window', color: new Color(1, 1, 1).multiplyScalar(WINDOW_BRIGHTNESS) },
      RANGE,
    )
    const bodyMaterial = createDistantMaterial(
      { name: 'distant/body', color: mixPalette('void', 'cedarDark', 0.5), vertexColors: true },
      STRUCTURE_FADE,
    )
    const roofMaterial = createDistantMaterial(
      { name: 'distant/roof', vertexColors: true, side: DoubleSide },
      STRUCTURE_FADE,
    )
    this.materials = [windowMaterial, bodyMaterial, roofMaterial]

    this.windows = new InstanceBank(createWindowQuad(), windowMaterial, MAX_PIECES, MAX_WINDOWS)
    this.boxes = new InstanceBank(createShadedBox(), bodyMaterial, MAX_NEAR, MAX_BOXES)
    this.roofs = new InstanceBank(createStoryRoof(), roofMaterial, MAX_NEAR, MAX_ROOFS)
    this.caps = new InstanceBank(createCapRoof(), roofMaterial, MAX_NEAR, 1)
    this.structureBanks = [this.boxes, this.roofs, this.caps]
    this.allBanks = [this.windows, ...this.structureBanks]
    this.meshes = this.allBanks.map((bank) => bank.mesh)
  }

  /**
   * Once per frame. `camera` is the camera's world position, `time` the shader clock (s),
   * `clearance` the space to keep out of, and `clearanceChanged` whether it moved since the
   * last frame.
   */
  update(camera: Vector3, time: number, clearance: WalkClearance, clearanceChanged: boolean) {
    const t0 = performance.now()
    this.clearance = clearance

    // The first frame fills the whole ring at once, already faded in.
    const first = !this.started
    if (first) {
      this.started = true
      for (const bank of this.allBanks) bank.beginBulk()
    }

    this.releaseDead(time)
    if (clearanceChanged && !first) this.revalidate(time)
    if (first || this.lastRebuild.distanceToSquared(camera) > REBUILD_STEP * REBUILD_STEP) this.rebuild(camera)
    this.spawnQueued(camera, first ? Number.POSITIVE_INFINITY : SPAWN_BUDGET, first ? -LIFE_FADE : time)
    this.updateStructure(camera, first ? Number.POSITIVE_INFINITY : STRUCTURE_BUDGET, first ? -LIFE_FADE : time)

    if (first) for (const bank of this.allBanks) bank.flush()
    this.windows.setTop(this.pieceSlots.top)
    for (const bank of this.structureBanks) bank.setTop(this.nearSlots.top)

    const ms = performance.now() - t0
    const s = this.stats
    s.pieces = this.live.length
    s.near = this.nearSlots.inUse
    s.queued = this.queue.length
    s.ms = ms
    if (ms > s.peakMs || time - this.peakAge > 1) {
      s.peakMs = ms
      this.peakAge = time
    }
  }

  dispose() {
    for (const bank of this.allBanks) bank.dispose()
    for (const material of this.materials) material.dispose()
  }

  private blocked(d: TowerDesign) {
    return this.clearance!.blocks(d.center, d.half)
  }

  /**
   * Works out the cells around the camera: creates the ones newly within CREATE (and queues
   * their pieces), and drops the ones now beyond KEEP, freeing their slots at once (they are
   * past 300 m, so already invisible).
   */
  private rebuild(camera: Vector3) {
    this.lastRebuild.copy(camera)
    const pass = ++this.pass
    const ccx = Math.floor(camera.x / CELL_SIZE)
    const ccy = Math.floor(camera.y / CELL_HEIGHT)
    const ccz = Math.floor(camera.z / CELL_SIZE)
    const ni = Math.ceil(KEEP / CELL_SIZE) + 1
    const nj = Math.ceil(KEEP / CELL_HEIGHT) + 1
    const keep2 = KEEP * KEEP
    const create2 = CREATE * CREATE

    for (let j = ccy - nj; j <= ccy + nj; j++) {
      const dy = gap(camera.y, j * CELL_HEIGHT, CELL_HEIGHT)
      for (let i = ccx - ni; i <= ccx + ni; i++) {
        const dx = gap(camera.x, i * CELL_SIZE, CELL_SIZE)
        for (let k = ccz - ni; k <= ccz + ni; k++) {
          const dz = gap(camera.z, k * CELL_SIZE, CELL_SIZE)
          const d2 = dx * dx + dy * dy + dz * dz
          if (d2 > keep2) continue
          const key = cellKey(i, j, k)
          let cell = this.cells.get(key)
          if (!cell) {
            if (d2 > create2) continue
            cell = { key, design: designTower(this.seed, i, j, k), mark: 0, slot: -1, near: -1, queued: false, removed: false, liveIndex: -1 }
            this.cells.set(key, cell)
          }
          cell.mark = pass
          this.enqueueIfWaiting(cell)
        }
      }
    }

    for (const [key, cell] of this.cells) {
      if (cell.mark === pass) continue
      this.cells.delete(key)
      cell.removed = true
      if (cell.slot >= 0) this.kill(cell, -1)
    }

    // Nearest first, so what's visible fills in before the far edge.
    const queue = this.queue
    const c = camera
    queue.sort((a, b) => a.design!.center.distanceToSquared(c) - b.design!.center.distanceToSquared(c))
  }

  /** The clearance moved: fade out pieces now inside it, and queue those no longer inside it. */
  private revalidate(time: number) {
    for (const cell of this.cells.values()) {
      if (!cell.design) continue
      if (cell.slot >= 0 && this.blocked(cell.design)) this.kill(cell, time)
      else this.enqueueIfWaiting(cell)
    }
  }

  private enqueueIfWaiting(cell: Cell) {
    if (cell.design && cell.slot < 0 && !cell.queued && !this.blocked(cell.design)) {
      cell.queued = true
      this.queue.push(cell)
    }
  }

  private spawnQueued(camera: Vector3, budget: number, born: number) {
    const queue = this.queue
    let read = 0
    let spawned = 0
    while (read < queue.length && spawned < budget) {
      const cell = queue[read++]
      cell.queued = false
      const d = cell.design!
      if (cell.removed || cell.slot >= 0 || this.blocked(d)) continue
      const slot = this.pieceSlots.alloc()
      if (slot < 0) break
      cell.slot = slot
      cell.liveIndex = this.live.length
      this.live.push(cell)
      this.writeWindows(cell, born)
      spawned++
      // A piece that spawns close gets its structure in the same frame, fading in with it.
      if (nearestDistance(d, camera) < NEAR_IN) this.addStructure(cell, born)
    }
    if (read > 0) {
      queue.copyWithin(0, read)
      queue.length -= read
    }
  }

  /** Gives pieces coming close their bodies and roofs, and takes them from pieces moving away. */
  private updateStructure(camera: Vector3, budget: number, born: number) {
    let built = 0
    for (const cell of this.live) {
      const d = nearestDistance(cell.design!, camera)
      if (cell.near < 0) {
        if (d < NEAR_IN && built < budget && this.addStructure(cell, born)) built++
      } else if (d > NEAR_OUT) {
        this.removeStructure(cell.near)
        cell.near = -1
      }
    }
  }

  /**
   * Takes a piece out of the world. With `fadeAt` ≥ 0 it fades out from then and its slots
   * are freed once it has gone; otherwise they are freed at once.
   */
  private kill(cell: Cell, fadeAt: number) {
    const last = this.live.pop()!
    if (last !== cell) {
      this.live[cell.liveIndex] = last
      last.liveIndex = cell.liveIndex
    }
    cell.liveIndex = -1

    if (fadeAt >= 0) {
      const at = fadeAt + LIFE_FADE
      this.windows.setDies(cell.slot, at)
      if (cell.near >= 0) for (const bank of this.structureBanks) bank.setDies(cell.near, at)
      this.dying.push({ slot: cell.slot, near: cell.near, at })
    } else {
      this.windows.clear(cell.slot)
      this.pieceSlots.release(cell.slot)
      if (cell.near >= 0) this.removeStructure(cell.near)
    }
    cell.slot = -1
    cell.near = -1
  }

  private releaseDead(time: number) {
    const dying = this.dying
    for (let i = dying.length - 1; i >= 0; i--) {
      const d = dying[i]
      if (d.at > time) continue
      this.windows.clear(d.slot)
      this.pieceSlots.release(d.slot)
      if (d.near >= 0) this.removeStructure(d.near)
      dying[i] = dying[dying.length - 1]
      dying.pop()
    }
  }

  private addStructure(cell: Cell, born: number) {
    const near = this.nearSlots.alloc()
    if (near < 0) return false
    cell.near = near
    const d = cell.design!
    for (const bank of this.structureBanks) bank.begin(near, d.center.x, d.center.z, born, d.spin, d.drift, d.heading, d.phase)
    this.current = d
    emitStructure(d, this.structureSink)
    for (const bank of this.structureBanks) bank.finish()
    return true
  }

  private removeStructure(near: number) {
    for (const bank of this.structureBanks) bank.clear(near)
    this.nearSlots.release(near)
  }

  private writeWindows(cell: Cell, born: number) {
    const d = cell.design!
    this.windows.begin(cell.slot, d.center.x, d.center.z, born, d.spin, d.drift, d.heading, d.phase)
    this.current = d
    emitWindows(d, this.windowSink)
    this.windows.finish()
  }

  /** Puts a part (local position, rotation about Y, scale) through the current piece's pose. */
  private place(x: number, y: number, z: number, yaw: number, sx: number, sy: number, sz: number) {
    const q = yaw === 0 ? IDENTITY_Q : scratchQ.setFromAxisAngle(Y_AXIS, yaw)
    scratchM.compose(scratchP.set(x, y, z), q, scratchS.set(sx, sy, sz))
    return scratchOut.multiplyMatrices(this.current!.pose, scratchM)
  }

  private readonly windowSink: TowerSink = {
    box: () => {},
    roof: () => {},
    window: (x, y, z, yaw, w, h, glow, warm) => {
      const c = this.tint.copy(this.windowTint[0]).lerp(this.windowTint[1], warm).multiplyScalar(glow)
      this.windows.push(this.place(x, y, z, yaw, w, h, 1), c.r, c.g, c.b)
    },
  }

  private readonly structureSink: TowerSink = {
    box: (x, y, z, sx, sy, sz, shade) => {
      this.boxes.push(this.place(x, y, z, 0, sx, sy, sz), shade, shade, shade)
    },
    roof: (x, y, z, sx, sy, sz, cap) => {
      ;(cap ? this.caps : this.roofs).push(this.place(x, y, z, 0, sx, sy, sz), 1, 1, 1)
    },
    window: () => {},
  }
}

/** Distance from `p` to the span [start, start + size] along one axis (0 inside it). */
function gap(p: number, start: number, size: number) {
  return p < start ? start - p : p > start + size ? p - start - size : 0
}

/** Packs a cell's coordinates into one exact integer (below 2⁵²): ±2¹⁹ cells across, ±2¹¹ up. */
function cellKey(i: number, j: number, k: number) {
  return ((i + 524288) * 1048576 + (k + 524288)) * 4096 + (j + 2048)
}

/** Distance from the camera to the nearest point of a piece's bounds (roughly: a sphere around them). */
function nearestDistance(d: TowerDesign, camera: Vector3) {
  return Math.max(0, d.center.distanceTo(camera) - d.half.length())
}
