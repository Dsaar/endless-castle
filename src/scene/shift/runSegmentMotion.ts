import gsap from 'gsap'
import { Vector3, type Group } from 'three'
import type { SegmentMotion, SegmentMotionState } from '../../world/shift/segmentMotion'
import { SHIFT_TIME } from './tuning'

/** The lurch: out in this long… */
const LURCH_OUT = 0.28
/** …and back, settling with a small overshoot. */
const LURCH_BACK = 1.2

/**
 * Plays a room-shift move on a segment. `outer` turns about the pivot and carries the offset;
 * `inner` (inside it, holding the segment at its start transform) undoes the pivot, so at rest
 * the two cancel and the segment stands where it was built. Updates `state` every step, so the
 * lights inside follow. Returns the timeline; killing it leaves the segment where it is.
 */
export function runSegmentMotion(motion: SegmentMotion, outer: Group, inner: Group, state: SegmentMotionState) {
  const pivot = new Vector3(...motion.pivot)
  const axis = new Vector3(...motion.axis).normalize()
  const [ox, oy, oz] = motion.offset
  const move = { k: motion.kind === 'arrive' ? 1 : 0 }

  inner.position.set(-pivot.x, -pivot.y, -pivot.z)
  const apply = () => {
    const k = move.k
    outer.position.set(pivot.x + ox * k, pivot.y + oy * k, pivot.z + oz * k)
    outer.quaternion.setFromAxisAngle(axis, motion.angle * k)
    state.light = motion.kind === 'lurch' ? 1 : 1 - k
    state.tick++
  }
  // Before the first frame: an arriving room must not be seen in place first.
  apply()

  const tl = gsap.timeline({ delay: motion.delay, onComplete: () => void state.tick++ })
  switch (motion.kind) {
    case 'depart':
      tl.to(move, { k: 1, duration: SHIFT_TIME, ease: 'power2.in', onUpdate: apply })
      break
    case 'arrive':
      tl.to(move, { k: 0, duration: SHIFT_TIME, ease: 'power3.out', onUpdate: apply })
      break
    case 'lurch':
      tl.to(move, { k: 1, duration: LURCH_OUT, ease: 'power2.out', onUpdate: apply })
      tl.to(move, { k: 0, duration: LURCH_BACK, ease: 'elastic.out(1, 0.45)', onUpdate: apply })
      break
  }
  return tl
}
