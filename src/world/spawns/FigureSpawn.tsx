import { useLayoutEffect, useMemo, useState, useSyncExternalStore } from 'react'
import HiddenFigure from '../../scene/figures/HiddenFigure'
import { FIGURES } from '../figures'
import type { Segment } from '../segment'
import { figureHolder, joinFigure, subscribeClaims } from './claims'
import FigurePerch from './FigurePerch'
import { figureSpot } from './spots'

/**
 * The hidden figure a segment may hold, and its perch, in the segment's frame. Mounted by
 * `SegmentView` inside the segment's wrappers, so a room shift carries both with the room.
 * The perch is always there when the room has a spot; the figure only while this room holds
 * it (see `claims`: never two of the same figure at once).
 */
export default function FigureSpawn({ segment }: { segment: Segment }) {
  const spot = useMemo(() => figureSpot(segment), [segment])
  const [room] = useState(() => ({}))

  useLayoutEffect(() => (spot ? joinFigure(spot.index, room) : undefined), [spot, room])
  const held = useSyncExternalStore(subscribeClaims, () => spot !== null && figureHolder(spot.index) === room)

  if (!spot) return null
  return (
    <>
      {spot.perch && <FigurePerch perch={spot.perch} />}
      {held && (
        <HiddenFigure index={spot.index} pose={FIGURES[spot.index].pose} position={spot.position} upsideDown={spot.upsideDown} />
      )}
    </>
  )
}
