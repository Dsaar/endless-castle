import { useEffect } from 'react'
import gsap from 'gsap'
import { clamp } from '../../lib/math'
import { cameraFx } from '../../state/cameraFx'
import { usePlayerStore } from '../../state/usePlayerStore'
import { useSubtitleStore } from '../../state/useSubtitleStore'
import { INVERT_ENTER, INVERT_EXIT, ROLL_PIVOT } from '../../world/segments/inverted/layout'
import type { WorldGenerator } from '../../world/WorldGenerator'

/** A full roll over (or back) takes this long, when there is time. */
const FLIP_TIME = 3
/** Rolling back on the way out never takes less than this, however fast you run. */
const MIN_FLIP_TIME = 1.2
/** Rolling back on the way out finishes about this share of the way to the door. */
const FLIP_LEAD = 0.85
/** Walking back out through the entrance, the roll back is quicker: the doorway is close behind. */
const BACK_OUT_SCALE = 0.5

/**
 * The Inverted Chamber's roll. A few steps into the chamber (INVERT_ENTER), GSAP rolls the
 * camera 180° over 3 s about a line halfway up the room (`cameraFx.roll`, which `Player`
 * applies), so you end up standing on the ceiling among the furniture, the floorboards over
 * your head. INVERT_EXIT before the far door it rolls back, fast enough to be upright by the
 * door even at a run. Walking back out the way you came rolls back too. A teleport snaps it.
 */
export default function InvertDirector({ generator }: { generator: WorldGenerator }) {
  useEffect(() => {
    let tween: gsap.core.Tween | null = null
    let target = 0
    let told = false

    const check = (progress: number, snap: boolean) => {
      const s = generator.segmentAt(progress)
      const into = s ? progress - s.startDistance : 0
      const inside = s?.kind === 'inverted' && into >= INVERT_ENTER && into <= s.length - INVERT_EXIT
      const next = inside ? Math.PI : 0
      if (next === target && !snap) return
      target = next
      if (inside) cameraFx.rollPivot = ROLL_PIVOT
      tween?.kill()
      tween = null
      if (snap) {
        cameraFx.roll = target
        return
      }

      const share = Math.abs(target - cameraFx.roll) / Math.PI
      let duration = FLIP_TIME * share
      if (!inside && s?.kind === 'inverted') {
        if (into < INVERT_ENTER) {
          duration *= BACK_OUT_SCALE
        } else {
          // On the way out: upright by the time you reach the door.
          const speed = usePlayerStore.getState().speed
          const left = s.length - into
          duration = clamp((left / Math.max(speed, 0.1)) * FLIP_LEAD, MIN_FLIP_TIME * share, duration)
        }
      }
      tween = gsap.to(cameraFx, {
        roll: target,
        duration,
        ease: 'power2.inOut',
        onComplete: () => {
          cameraFx.roll = target
          tween = null
        },
      })
      if (inside && !told) {
        told = true
        useSubtitleStore.getState().showSubtitle('The floor is above you.', '床が頭上にある。', 3)
      }
    }

    check(usePlayerStore.getState().progress, true)
    const unsubscribe = usePlayerStore.subscribe((s, prev) => {
      if (s.jumps !== prev.jumps) check(s.progress, true)
      else if (s.progress !== prev.progress) check(s.progress, false)
    })
    return () => {
      unsubscribe()
      tween?.kill()
      cameraFx.roll = 0
    }
  }, [generator])

  return null
}
