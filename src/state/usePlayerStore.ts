import { create } from 'zustand'
import { clamp } from '../lib/math'
import { MAX_LEAD } from '../scene/player/tuning'

/**
 * Where the player is along the world's walk, in meters from the start of the Gate.
 *
 * Input moves `targetProgress`; `Player` eases `progress` toward it every frame. While the
 * player is moving, `progress` and `speed` change every frame, so React components should
 * not subscribe to them directly: read them with `getState()`, `subscribe`, or a selector
 * that derives something coarse (a boolean, a segment index).
 */
interface PlayerState {
  /**
   * The walkable stretch of the walk, set by the world as it generates segments ahead and
   * forgets old ones behind. Progress stays inside it. Both 0 until the world is ready.
   */
  pathStart: number
  pathEnd: number
  /** Where input wants the player to be. */
  targetProgress: number
  /** Where the player is (smoothed). */
  progress: number
  /** Current walking speed in m/s (unsigned). */
  speed: number
  /** Counts `jumpTo` calls, so `Player` knows to snap instead of walk. */
  jumps: number
  setPathBounds: (pathStart: number, pathEnd: number) => void
  /** Move the target by `meters` (negative walks back), within the path and MAX_LEAD. */
  walkBy: (meters: number) => void
  /** Teleport to `progress` (dev tools): no walk, no footsteps. */
  jumpTo: (progress: number) => void
}

/** Keeps a target on the walkable stretch, and at most MAX_LEAD from the player. */
export function clampTarget(target: number, progress: number, pathStart: number, pathEnd: number) {
  return clamp(target, Math.max(pathStart, progress - MAX_LEAD), Math.min(pathEnd, progress + MAX_LEAD))
}

export const usePlayerStore = create<PlayerState>()((set) => ({
  pathStart: 0,
  pathEnd: 0,
  targetProgress: 0,
  progress: 0,
  speed: 0,
  jumps: 0,
  setPathBounds: (pathStart, pathEnd) =>
    set((s) => ({
      pathStart,
      pathEnd,
      progress: clamp(s.progress, pathStart, pathEnd),
      targetProgress: clamp(s.targetProgress, pathStart, pathEnd),
    })),
  walkBy: (meters) =>
    set((s) => ({ targetProgress: clampTarget(s.targetProgress + meters, s.progress, s.pathStart, s.pathEnd) })),
  jumpTo: (progress) =>
    set((s) => {
      const p = clamp(progress, s.pathStart, s.pathEnd)
      return { progress: p, targetProgress: p, speed: 0, jumps: s.jumps + 1 }
    }),
}))
