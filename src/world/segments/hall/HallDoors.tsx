import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import type { Group } from 'three'
import ShojiPanel from '../../../scene/kit/ShojiPanel'
import { WALL_PANEL_SIZE } from '../shojiWall'
import type { DoorwaySpec } from './layout'

interface HallDoorsProps {
  doorway: DoorwaySpec
  /** Slid shut. Open doors stand parked over the panels either side of the doorway. */
  closed: boolean
  seed: number
}

const DURATION = 1.4
const [WIDTH, HEIGHT] = WALL_PANEL_SIZE
/** Shut, each panel fills half the doorway; open, it has slid one panel width aside. */
const CLOSED_X = WIDTH / 2
const OPEN_X = WIDTH * 1.5

/**
 * A doorway's pair of lit shoji, running in a track just inside the wall. They slide shut when
 * `closed` turns true. If they are already shut on mount (the hall remounted behind a player
 * walking back), they start shut.
 */
export default function HallDoors({ doorway, closed, seed }: HallDoorsProps) {
  const leftRef = useRef<Group>(null)
  const rightRef = useRef<Group>(null)
  const [startX] = useState(() => (closed ? CLOSED_X : OPEN_X))

  useEffect(() => {
    const l = leftRef.current
    const r = rightRef.current
    if (!l || !r) return
    const x = closed ? CLOSED_X : OPEN_X
    if (Math.abs(r.position.x - x) < 1e-6) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      l.position.x = -x
      r.position.x = x
      return
    }
    const timeline = gsap
      .timeline()
      .to(l.position, { x: -x, duration: DURATION, ease: 'power2.inOut' }, 0)
      .to(r.position, { x, duration: DURATION, ease: 'power2.inOut' }, 0.15)
    return () => {
      timeline.kill()
    }
  }, [closed])

  return (
    <group position={doorway.position} rotation={[0, doorway.yaw, 0]}>
      <group ref={leftRef} position={[-startX, 0, 0]}>
        <ShojiPanel size={[WIDTH, HEIGHT]} lit seed={seed} />
      </group>
      <group ref={rightRef} position={[startX, 0, 0]}>
        <ShojiPanel size={[WIDTH, HEIGHT]} lit seed={seed + 1} />
      </group>
    </group>
  )
}
