/** Last frame's renderer totals (dev builds), filled by `RenderStats`, read by the dev panel. */
export const frameStats = { calls: 0, triangles: 0, programs: 0 }

/** The distant castle's last update (dev builds), filled by `DistantCastle`, read by the dev panel. */
export const distantCastleStats = { pieces: 0, near: 0, queued: 0, ms: 0, peakMs: 0 }
