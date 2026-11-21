import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import type { Group } from 'three'
import ShojiPanel from '../../../scene/kit/ShojiPanel'
import { usePlayerStore } from '../../../state/usePlayerStore'
import { useProgressTrigger } from '../../useProgressTrigger'

interface SlidingDoorPairProps {
  /** z of the wall line. */
  z: number
  /** Floor of the track (top of the sill). */
  y: number
  /** Width and height of each panel. */
  width: number
  height: number
  /** +1 if the room is on the +Z side of the wall, -1 if on the -Z side. The doors run in the room-side track. */
  roomSide: number
  /** Track offset from the wall line. */
  track: number
  /** Progress along the walk at which they slide open. Omit for doors that are already open. */
  openAt?: number
  seed: number
}

const DURATION = 1.5

/**
 * The middle two panels of a room's end wall: lit shoji that slide apart over the fixed outer
 * panels when the player comes near, showing the next room. They start open when there is no
 * `openAt`, or when the player is already past it (the room remounted behind them).
 */
export default function SlidingDoorPair({ z, y, width, height, roomSide, track, openAt, seed }: SlidingDoorPairProps) {
  const leftRef = useRef<Group>(null)
  const rightRef = useRef<Group>(null)
  const tween = useRef<gsap.core.Timeline | null>(null)
  const [startOpen] = useState(() => openAt === undefined || usePlayerStore.getState().progress >= openAt)
  // Closed, each panel sits half a panel from the middle; open, it has slid one panel outward.
  const closedX = width / 2
  const openX = width * 1.5

  const open = useCallback(
    (immediate: boolean) => {
      const l = leftRef.current
      const r = rightRef.current
      if (!l || !r) return
      tween.current?.kill()
      if (immediate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        l.position.x = -openX
        r.position.x = openX
        return
      }
      tween.current = gsap
        .timeline()
        .to(l.position, { x: -openX, duration: DURATION, ease: 'power2.inOut' }, 0)
        .to(r.position, { x: openX, duration: DURATION, ease: 'power2.inOut' }, 0.12)
    },
    [openX],
  )
  useProgressTrigger(startOpen || openAt === undefined ? Number.POSITIVE_INFINITY : openAt, open)
  useEffect(
    () => () => {
      tween.current?.kill()
      tween.current = null
    },
    [],
  )

  const x0 = startOpen ? openX : closedX
  return (
    <group position={[0, y, z + roomSide * track]}>
      <group ref={leftRef} position={[-x0, 0, 0]}>
        <ShojiPanel size={[width, height]} seed={seed} />
      </group>
      <group ref={rightRef} position={[x0, 0, 0]}>
        <ShojiPanel size={[width, height]} seed={seed + 1} />
      </group>
    </group>
  )
}
