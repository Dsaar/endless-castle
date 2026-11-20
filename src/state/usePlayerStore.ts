import { create } from 'zustand'
import { clamp } from '../lib/math'
import { MAX_LEAD } from '../scene/player/tuning'

/**
 * Where the player is along the world's path, in meters from its start.
 *
 * Input moves `targetProgress`; `Player` eases `progress` toward it every frame. While the
 * player is moving, `progress` and `speed` change every frame, so React components should
 * not subscribe to them directly: read them with `getState()`, `subscribe`, or a selector
 * that derives something coarse (a boolean, a segment index).
 */
interface PlayerState {
  /** Length of the current path; progress can't pass it. 0 until the path is known. */
  pathLength: number
  /** Where input wants the player to be. */
  targetProgress: number
  /** Where the player is (smoothed). */
  progress: number
  /** Current walking speed in m/s (unsigned). */
  speed: number
  setPathLength: (pathLength: number) => void
  /** Move the target by `meters` (negative walks back), within the path and MAX_LEAD. */
  walkBy: (meters: number) => void
}

/** Keeps a target on the path, never below the start, and at most MAX_LEAD from the player. */
export function clampTarget(target: number, progress: number, pathLength: number) {
  return clamp(target, Math.max(0, progress - MAX_LEAD), Math.min(pathLength, progress + MAX_LEAD))
}

export const usePlayerStore = create<PlayerState>()((set) => ({
  pathLength: 0,
  targetProgress: 0,
  progress: 0,
  speed: 0,
  setPathLength: (pathLength) =>
    set((s) => ({
      pathLength,
      progress: Math.min(s.progress, pathLength),
      targetProgress: Math.min(s.targetProgress, pathLength),
    })),
  walkBy: (meters) =>
    set((s) => ({ targetProgress: clampTarget(s.targetProgress + meters, s.progress, s.pathLength) })),
}))
