import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import { Vector3 } from 'three'
import { createRandom, hashSeed } from '../../lib/random'
import { onBiwa, emitBiwa, type BiwaEvent } from '../../state/biwa'
import { cameraFx } from '../../state/cameraFx'
import { scriptedWalk } from '../../state/scriptedWalk'
import { useFallStore } from '../../state/useFallStore'
import { useForkStore } from '../../state/useForkStore'
import { useGameStore } from '../../state/useGameStore'
import { usePlayerStore } from '../../state/usePlayerStore'
import { useShiftStore } from '../../state/useShiftStore'
import { useSubtitleStore } from '../../state/useSubtitleStore'
import type { Segment } from '../../world/segment'
import type { BranchParams } from '../../world/segments/branch/definition'
import type { RandomSegmentKind } from '../../world/segments/registry'
import type { SegmentMotion } from '../../world/shift/segmentMotion'
import { arriveMotion, departMotion, lurchMotion } from '../../world/shift/shiftMotions'
import type { WorldGenerator } from '../../world/WorldGenerator'
import { MAX_DT, STILL_SPEED } from '../player/tuning'
import {
  COOLDOWN,
  LURCH_DROP,
  LURCH_SIDE,
  LURCH_TURN,
  MOVED_SPEED,
  RANDOM_MEAN,
  RANDOM_ROOM_LEFT,
  SHAKE_RISE,
  SHIFT_END,
  SHIFT_STAGGER,
  SHIFT_TIME,
  STILL_TIME,
} from './tuning'

/** Keeps the shift choreography's random numbers apart from the castle's. */
const MOTION_SALT = 0xb1fa
const LURCH = { side: LURCH_SIDE, drop: LURCH_DROP, turn: LURCH_TURN }
const scratch = new Vector3()
/** Dev: how far before a freshly built room's door you're put (meters). */
const DOOR_DISTANCE = 1.2

/** The camera is upright or upside down, not part-way through the Inverted Chamber's roll. */
function settledRoll() {
  return cameraFx.roll === 0 || cameraFx.roll === Math.PI
}

/** Nothing scripted is running, so the rooms may move. */
function quiet() {
  const game = useGameStore.getState()
  const forks = useForkStore.getState()
  return (
    game.introComplete &&
    !game.guideOpen &&
    useFallStore.getState().phase === 'done' &&
    !scriptedWalk.active &&
    !forks.taking &&
    !useShiftStore.getState().active
  )
}

/** `segment` and the previews of it that aren't the way taken: they move as one. */
function withPreviews(generator: WorldGenerator, segment: Segment): Segment[] {
  const taken = generator.byId(segment.id + 1)
  const out = [segment]
  for (const preview of segment.previews ?? []) {
    if (preview.segments[0] !== taken) out.push(...preview.segments)
  }
  return out
}

/**
 * THE BIWA: a string is plucked somewhere, and the rooms move.
 *
 * It sounds (`emitBiwa`) when the player has stood still for STILL_TIME (once per stop), now
 * and then at random while walking (about once every RANDOM_MEAN seconds, never within COOLDOWN
 * of the last), or from the dev panel. Never during the opening, the Fall, the guide, a turn at
 * a fork, a stop at a fork, or the Inverted Chamber's roll.
 *
 * Then, over SHIFT_TIME: the generator rebuilds everything past the room you're in
 * (`rebuildAhead`), so the walk ahead is new but joins on where it did. The old rooms stay on
 * screen and slide, swing or drop away; the new ones slide, swing or rise into place one after
 * another; the room you're in lurches around you; the camera shakes. The walk is held at the
 * doorway until the new rooms have landed. At a fork still waiting for a choice there is nothing
 * ahead to rebuild: only the lurch and the shake.
 */
export default function ShiftDirector({ generator }: { generator: WorldGenerator }) {
  /** Stillness, whether the player has walked since the last shift, and the cooldown. */
  const watch = useRef({ still: 0, moved: false, cooldown: COOLDOWN })

  useEffect(() => {
    let shifts = 0
    let told = false
    let shake: gsap.core.Timeline | null = null
    let ending: gsap.core.Tween | null = null

    const finish = () => {
      ending?.kill()
      ending = null
      generator.holdEnd = Number.POSITIVE_INFINITY
      if (useShiftStore.getState().active) useShiftStore.getState().end()
    }

    const shiftRooms = (event: BiwaEvent) => {
      if (!quiet()) {
        if (event.reason === 'dev') console.warn('[shift] Not now: the opening, the Fall, the guide, a turn at a fork, or a shift is running.')
        return
      }
      const progress = usePlayerStore.getState().progress
      const n = ++shifts
      const rand = createRandom(hashSeed(generator.seed, n, MOTION_SALT))
      const lastMounted = generator.last
      const holder = generator.segmentAt(progress)
      const rebuild = generator.rebuildAhead(progress, event.kind)
      const motions = new Map<string, SegmentMotion>()
      const departing: Segment[] = []

      // The room you're in (the hall, if you're on the walk out of it) lurches around you.
      const room = holder?.kind === 'branch' ? generator.byId((holder.params as BranchParams).forkId) : holder
      if (room) {
        const at = generator.path.getPointAt(progress, scratch)
        const lurch = lurchMotion([at.x, at.y, at.z], room.start.yaw, rand, n, LURCH)
        for (const s of withPreviews(generator, room)) motions.set(s.key, lurch)
      }

      if (rebuild) {
        // The rooms that were on screen leave, nearest first, each with its fork's previews.
        const removed = new Set(rebuild.removed)
        rebuild.removed
          .filter((s) => s.id <= lastMounted)
          .forEach((s, i) => {
            const move = departMotion(s, rand, n, i * SHIFT_STAGGER)
            const group = [s, ...(s.previews ?? []).flatMap((p) => p.segments).filter((p) => !removed.has(p))]
            for (const g of group) {
              departing.push(g)
              motions.set(g.key, move)
            }
          })
        // Every new room arrives (only those that mount during the shift are seen to).
        generator.segments
          .filter((s) => s.id > rebuild.anchor.id)
          .forEach((s, i) => {
            const move = arriveMotion(s, rand, n, SHIFT_STAGGER * (1.5 + i))
            for (const g of withPreviews(generator, s)) motions.set(g.key, move)
          })
        generator.holdEnd = rebuild.anchor.startDistance + rebuild.anchor.length
      } else if (event.kind) {
        console.warn('[shift] Nothing ahead can change here (the opening, or a fork waiting for a choice).')
      }

      const w = watch.current
      w.still = 0
      w.moved = false
      w.cooldown = COOLDOWN

      useShiftStore.getState().begin({ n, departing, motions })
      shake?.kill()
      shake = gsap.timeline()
      shake.to(cameraFx, { shake: 1, duration: SHAKE_RISE, ease: 'power2.out' })
      shake.to(cameraFx, { shake: 0, duration: SHIFT_TIME - SHAKE_RISE, ease: 'sine.inOut' })
      ending?.kill()
      ending = gsap.delayedCall(SHIFT_END, finish)

      if (!told) {
        told = true
        useSubtitleStore.getState().showSubtitle('A string is plucked. The rooms move.', '琵琶が鳴る。部屋が動く。', 3.5)
      }
    }

    // Dev: the next room is `kind`, built at once, with no shift to watch; then you're at its door.
    const buildRoom = (kind: RandomSegmentKind) => {
      if (!quiet()) {
        console.warn('[shift] Not now: the opening, the Fall, the guide, a turn at a fork, or a shift is running.')
        return
      }
      const rebuild = generator.rebuildAhead(usePlayerStore.getState().progress, kind)
      if (!rebuild) {
        console.warn('[shift] Nothing ahead can change here (a fork waiting for a choice): choose a way first.')
        return
      }
      useShiftStore.getState().rebuilt()
      const door = rebuild.anchor.startDistance + rebuild.anchor.length
      usePlayerStore.getState().jumpTo(Math.max(rebuild.anchor.startDistance, door - DOOR_DISTANCE))
    }

    const unsubscribe = onBiwa(shiftRooms)
    const unsubscribeRequests = useShiftStore.subscribe((s, prev) => {
      if (s.request && s.request !== prev.request) buildRoom(s.request.kind)
    })
    // A teleport isn't a walk: standing still after one doesn't count until you've walked again.
    const unsubscribeJumps = usePlayerStore.subscribe((s, prev) => {
      if (s.jumps === prev.jumps) return
      watch.current.still = 0
      watch.current.moved = false
    })
    return () => {
      unsubscribe()
      unsubscribeRequests()
      unsubscribeJumps()
      shake?.kill()
      cameraFx.shake = 0
      finish()
    }
  }, [generator])

  useFrame((_, delta) => {
    const w = watch.current
    const dt = Math.min(delta, MAX_DT)
    if (!quiet() || useForkStore.getState().waiting || !settledRoll()) {
      w.still = 0
      return
    }
    w.cooldown = Math.max(0, w.cooldown - dt)
    const { speed, progress } = usePlayerStore.getState()
    if (speed < STILL_SPEED) w.still += dt
    else {
      w.still = 0
      if (speed >= MOVED_SPEED) w.moved = true
    }
    if (w.cooldown > 0) return

    if (w.moved && w.still >= STILL_TIME) {
      emitBiwa({ reason: 'still' })
      return
    }
    // At random while walking, with enough room left that the hold at the doorway won't stop you short.
    if (speed >= MOVED_SPEED && Math.random() < dt / RANDOM_MEAN) {
      const s = generator.segmentAt(progress)
      if (s && s.startDistance + s.length - progress >= RANDOM_ROOM_LEFT) emitBiwa({ reason: 'random' })
    }
  })

  return null
}
