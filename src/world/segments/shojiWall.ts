import { randInt, type Random } from '../../lib/random'
import type { ShojiPlacement } from '../../scene/kit/ShojiInstances'
import type { BoxSpec, InstanceTransform } from '../../scene/kit/types'
import { BAY } from './common'

/** The vertical stack of every shoji wall along a walk (meters, from the floor up). */
export const WALL_SILL = 0.05
export const WALL_PANEL = 2.0
export const WALL_KAMOI = 0.12
export const WALL_TRANSOM = 0.42
export const WALL_HEAD = 0.1
/** Floor to ceiling. */
export const WALL_HEIGHT = WALL_SILL + WALL_PANEL + WALL_KAMOI + WALL_TRANSOM + WALL_HEAD
export const WALL_POST = 0.14
/** Two sliding panels per bay, and one lattice transom above them. */
export const WALL_PANEL_SIZE: [number, number] = [(BAY - WALL_POST) / 2, WALL_PANEL]
export const WALL_TRANSOM_SIZE: [number, number] = [BAY - WALL_POST, WALL_TRANSOM]

export interface ShojiWall {
  /** Posts at every bay line, for `BoxInstances` (anchor base). */
  posts: InstanceTransform[]
  /** Sill, kamoi (door head) and head beam, the length of the wall. */
  boxes: BoxSpec[]
  panels: ShojiPlacement[]
  transoms: ShojiPlacement[]
}

/**
 * z of the post on bay line `i`. The end posts are pulled in by half their width, so nothing
 * crosses the segment's ends: neighbours never poke through each other.
 */
export function postZ(i: number, bays: number, post = WALL_POST) {
  if (i === 0) return -post / 2
  if (i === bays) return -bays * BAY + post / 2
  return -i * BAY
}

/**
 * A wall of shoji along the walk at `x`, from z = 0 to `-bays × BAY`: posts at each bay line
 * (minus `skipPosts`, e.g. where a vermilion post stands instead), two panels per bay, and a
 * lattice transom above a door-head beam. Bay `i` is lit when `lit[i]` is.
 */
export function shojiWall(x: number, bays: number, lit: readonly boolean[], skipPosts: readonly number[] = []): ShojiWall {
  const L = bays * BAY
  const posts: InstanceTransform[] = []
  for (let i = 0; i <= bays; i++) if (!skipPosts.includes(i)) posts.push({ position: [x, 0, postZ(i, bays)] })

  const boxes: BoxSpec[] = [
    { size: [0.1, WALL_SILL, L], position: [x, WALL_SILL / 2, -L / 2] },
    { size: [0.1, WALL_KAMOI, L], position: [x, WALL_SILL + WALL_PANEL + WALL_KAMOI / 2, -L / 2] },
    { size: [0.16, WALL_HEAD, L], position: [x, WALL_HEIGHT - WALL_HEAD / 2, -L / 2] },
  ]

  const [pw] = WALL_PANEL_SIZE
  const panels: ShojiPlacement[] = []
  const transoms: ShojiPlacement[] = []
  for (let i = 0; i < bays; i++) {
    for (let k = 0; k < 2; k++) {
      panels.push({ position: [x, WALL_SILL, -(i * BAY + WALL_POST / 2 + pw * (k + 0.5))], yaw: Math.PI / 2, lit: lit[i] })
    }
    transoms.push({ position: [x, WALL_SILL + WALL_PANEL + WALL_KAMOI, -(i + 0.5) * BAY], yaw: Math.PI / 2, lit: lit[i] })
  }
  return { posts, boxes, panels, transoms }
}

/** How a wall's bays are lit. */
export type LitPattern = 'all' | 'alternate' | 'sparse' | 'dark-run' | 'none'

/** Which of `bays` bays glow, for a pattern. `phase` shifts alternating patterns. */
export function litBays(rand: Random, bays: number, pattern: LitPattern, phase = 0): boolean[] {
  const run = pattern === 'dark-run' ? randInt(rand, 0, Math.max(0, bays - 4)) : -1
  const runLength = randInt(rand, 2, 4)
  return Array.from({ length: bays }, (_, i) => {
    switch (pattern) {
      case 'all':
        return true
      case 'none':
        return false
      case 'alternate':
        return (i + phase) % 2 === 0
      case 'sparse':
        return rand() < 0.7
      case 'dark-run':
        return i < run || i >= run + runLength
    }
  })
}
