import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Group } from 'three'
import { runSegmentMotion } from '../scene/shift/runSegmentMotion'
import type { Segment } from './segment'
import FigureSpawn from './spawns/FigureSpawn'
import { SegmentMotionContext, type SegmentMotion, type SegmentMotionState } from './shift/segmentMotion'

interface SegmentViewProps<P> {
  segment: Segment<P>
  /** A room shift's move. Played once when a new one arrives; taking it away doesn't stop it. */
  motion?: SegmentMotion
}

/**
 * Mounts one segment's component in its local frame (its start transform), inside two
 * wrapper groups that stay at rest except while a room shift moves the segment. Any hidden
 * figure the segment holds (and its perch) mounts in the same frame, so it moves with the room.
 */
export default function SegmentView<P>({ segment, motion }: SegmentViewProps<P>) {
  const { Component, start } = segment
  const outer = useRef<Group>(null)
  const inner = useRef<Group>(null)
  const [state] = useState<SegmentMotionState>(() => ({ tick: 0, light: 1 }))
  const running = useRef<{ motion: SegmentMotion; timeline: ReturnType<typeof runSegmentMotion> } | null>(null)

  // Layout effect: an arriving room is moved out of place before it is ever drawn in place.
  useLayoutEffect(() => {
    if (!motion || running.current?.motion === motion || !outer.current || !inner.current) return
    running.current?.timeline.kill()
    running.current = { motion, timeline: runSegmentMotion(motion, outer.current, inner.current, state) }
  }, [motion, state])

  useEffect(
    () => () => {
      running.current?.timeline.kill()
      running.current = null
    },
    [],
  )

  return (
    <SegmentMotionContext.Provider value={state}>
      <group ref={outer}>
        <group ref={inner}>
          <group position={[start.x, start.y, start.z]} rotation={[0, start.yaw, 0]}>
            <Component segment={segment} />
            <FigureSpawn segment={segment as Segment} />
          </group>
        </group>
      </group>
    </SegmentMotionContext.Provider>
  )
}
