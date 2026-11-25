import { startTransition, useEffect, useState } from 'react'
import { useForkStore } from '../state/useForkStore'
import { usePlayerStore } from '../state/usePlayerStore'
import { useShiftStore } from '../state/useShiftStore'
import { useWorldStore } from '../state/useWorldStore'
import SegmentView from './SegmentView'
import type { WorldGenerator } from './WorldGenerator'

interface WorldProps {
  generator: WorldGenerator
}

/**
 * Mounts the generator's window of segments around the player and keeps everything else in
 * step: the walkable bounds in `usePlayerStore`, and the area, kanji and room number in
 * `useWorldStore`. It listens to progress with `subscribe` (no re-render per frame) and only
 * re-renders when the window changes. Mounting is a transition, so React can spread the
 * work of building a new segment over a few frames.
 *
 * A Crossroads' previews (the rooms down the ways not yet chosen) mount with it. The chosen
 * one keeps its key when it joins the walk, so it never remounts.
 *
 * During a room shift (`useShiftStore.active`), the rooms taken out of the walk stay mounted
 * under their old keys while they leave, every moving segment gets its move, and the walkable
 * end is held at the generator's `holdEnd` until the new rooms are in place.
 */
export default function World({ generator }: WorldProps) {
  const shift = useShiftStore((s) => s.active)
  // Re-render when the generator replaced segments, even if the window's ids are the same.
  useShiftStore((s) => s.version)
  const [range, setRange] = useState(() => {
    generator.update(usePlayerStore.getState().progress)
    return { first: generator.first, last: generator.last }
  })

  useEffect(() => {
    let current = -1
    let start = Number.NaN
    let end = Number.NaN

    const sync = (progress: number) => {
      generator.update(progress)
      const { first, last, path } = generator
      setWindowIfChanged(first, last)

      const walkEnd = Math.min(path.end, generator.holdEnd)
      if (path.start !== start || walkEnd !== end) {
        start = path.start
        end = walkEnd
        usePlayerStore.getState().setPathBounds(start, end)
      }

      if (generator.current !== current) {
        current = generator.current
        const segment = generator.byId(current)
        if (segment) {
          useWorldStore.getState().setLocation({
            area: segment.area,
            kanji: segment.kanji,
            kind: segment.kind,
            room: segment.room,
            untilJunction: segment.untilJunction,
            segmentStart: segment.startDistance,
            segmentEnd: segment.startDistance + segment.length,
          })
        }
      }
    }

    let shownFirst = -1
    let shownLast = -1
    const setWindowIfChanged = (first: number, last: number) => {
      if (first === shownFirst && last === shownLast) return
      shownFirst = first
      shownLast = last
      startTransition(() => setRange({ first, last }))
    }

    sync(usePlayerStore.getState().progress)
    const unsubscribePlayer = usePlayerStore.subscribe((s, prev) => {
      if (s.progress !== prev.progress || s.jumps !== prev.jumps) sync(s.progress)
    })
    // A way chosen at a fork: the walk now runs on past it.
    const unsubscribeFork = useForkStore.subscribe((s, prev) => {
      if (s.chosen !== prev.chosen) sync(usePlayerStore.getState().progress)
    })
    // A room shift began or ended, or the rooms ahead were rebuilt: new segments, a held walk.
    const unsubscribeShift = useShiftStore.subscribe((s, prev) => {
      if (s.active !== prev.active || s.version !== prev.version) {
        current = -1
        sync(usePlayerStore.getState().progress)
      }
    })
    return () => {
      unsubscribePlayer()
      unsubscribeFork()
      unsubscribeShift()
    }
  }, [generator])

  const motions = shift?.motions
  const mounted = []
  for (let id = range.first; id <= range.last; id++) {
    const segment = generator.byId(id)
    if (!segment) continue
    mounted.push(<SegmentView key={segment.key} segment={segment} motion={motions?.get(segment.key)} />)
    for (const preview of segment.previews ?? []) {
      // The chosen way is in the walk itself now.
      if (preview.segments[0] === generator.byId(segment.id + 1)) continue
      for (const s of preview.segments) mounted.push(<SegmentView key={s.key} segment={s} motion={motions?.get(s.key)} />)
    }
  }
  // Same keys as before they left the walk, so they stay mounted and just move away.
  for (const s of shift?.departing ?? []) mounted.push(<SegmentView key={s.key} segment={s} motion={motions?.get(s.key)} />)
  return <>{mounted}</>
}
