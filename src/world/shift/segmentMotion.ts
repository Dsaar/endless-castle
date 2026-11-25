import { createContext, useContext } from 'react'
import type { Vec3 } from '../../scene/kit/types'

/**
 * During a room shift, segments move: the rooms ahead leave, new ones arrive, the room you
 * stand in lurches. `SegmentView` plays a `SegmentMotion` on a wrapper around the segment;
 * anything inside that registered a light at its mounted position reads `SegmentMotionState`
 * from context and follows (see `LanternInstances`, `PooledLight`).
 */

export type SegmentMotionKind = 'depart' | 'arrive' | 'lurch'

/**
 * A rigid move in world space: turn `angle` about `axis` through `pivot`, and translate by
 * `offset`, both scaled by how far along the move is. A departure goes from rest to full; an
 * arrival from full to rest; a lurch out to full and back. A fork's previews share its motion,
 * so the whole hall moves as one.
 */
export interface SegmentMotion {
  /** The shift it belongs to. */
  shift: number
  kind: SegmentMotionKind
  pivot: Vec3
  /** Unit axis. */
  axis: Vec3
  angle: number
  offset: Vec3
  /** Seconds before it starts (the rooms go one after another). */
  delay: number
}

/** A segment's current move, as the lights inside it see it. Mutable; never re-renders. */
export interface SegmentMotionState {
  /** Bumped whenever the segment's transform changes, so the lights know to follow. */
  tick: number
  /** How much of their light they give, 0 … 1: rooms fade out as they leave, in as they arrive. */
  light: number
}

export const SegmentMotionContext = createContext<SegmentMotionState | null>(null)

/** The move of the segment this component is in, or null outside one (the kit view, the backdrop). */
export function useSegmentMotion() {
  return useContext(SegmentMotionContext)
}
