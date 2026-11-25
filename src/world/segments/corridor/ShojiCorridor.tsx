import { useCallback, useMemo } from 'react'
import BoxInstances from '../../../scene/kit/BoxInstances'
import FloorPlanks from '../../../scene/kit/FloorPlanks'
import LanternInstances from '../../../scene/kit/LanternInstances'
import { getLacquerMaterial } from '../../../scene/kit/materials'
import MergedBoxes from '../../../scene/kit/MergedBoxes'
import Roof from '../../../scene/kit/Roof'
import ShojiInstances from '../../../scene/kit/ShojiInstances'
import { useSubtitleStore } from '../../../state/useSubtitleStore'
import type { SegmentProps } from '../../segment'
import { useProgressTrigger } from '../../useProgressTrigger'
import { WALL_HEIGHT, WALL_PANEL_SIZE, WALL_POST, WALL_SILL, WALL_TRANSOM_SIZE } from '../shojiWall'
import SlidingDoorPair from '../tatami/SlidingDoorPair'
import {
  BATTEN,
  BRACKET,
  buildCorridorLayout,
  CORRIDOR_WIDTH,
  END_DOOR_INSET,
  END_DOOR_SIZE,
  END_TRANSOM_SIZE,
  LANTERN_CORD,
  LANTERN_SIZE,
  PIER,
  type CorridorParams,
} from './layout'

/** The false exit slides open when the player is this close to it (meters). */
const FALSE_EXIT_OPEN_BEFORE = 5
/** A copy says so once the player is this far into it. */
const ECHO_SUBTITLE_AT = 2

/**
 * The Shoji Corridor: a long, straight, enclosed hall of glowing shoji, lit on one side,
 * both or in patterns, with wall lanterns at eye level and one or two vermilion portals.
 * Floorboards run along it, so its lines draw the eye down a long vanishing view. A roof
 * over it gives it a shape from outside. About 19 draw calls, whatever its length.
 *
 * Sometimes it ends in a false exit: a closed pair of shoji that slide open as you come near,
 * onto the same corridor again (then perhaps once more). The copy is identical down to the
 * lantern flicker; only the room number has moved on.
 */
export default function ShojiCorridor({ segment }: SegmentProps<CorridorParams>) {
  const p = segment.params
  const layout = useMemo(() => buildCorridorLayout(p), [p])
  const L = p.length
  const start = segment.startDistance

  const onEcho = useCallback(
    (immediate: boolean) => {
      if (!immediate) useSubtitleStore.getState().showSubtitle('The same corridor.', '同じ廊下。', 3)
    },
    [],
  )
  useProgressTrigger(p.echo > 0 ? start + ECHO_SUBTITLE_AT : Number.POSITIVE_INFINITY, onEcho)

  return (
    <group>
      {/* Boards along the corridor (the kit lays them along local X, so turn it). */}
      <FloorPlanks position={[0, 0, -L / 2]} rotation={[0, Math.PI / 2, 0]} size={[L, CORRIDOR_WIDTH]} seed={p.seed} />
      <MergedBoxes boxes={layout.boxes} seed={p.seed} />
      <MergedBoxes boxes={layout.lacquer} material={getLacquerMaterial()} seed={p.seed + 1} />
      <BoxInstances size={[WALL_POST, WALL_HEIGHT, WALL_POST]} anchor="base" grain={1} items={layout.posts} seed={p.seed} />
      <ShojiInstances size={WALL_PANEL_SIZE} panels={layout.panels} seed={p.seed} />
      <ShojiInstances size={WALL_TRANSOM_SIZE} kickboard={false} panels={layout.transoms} seed={p.seed + 1} />
      <BoxInstances size={BATTEN} grain={0} items={layout.battens} seed={p.seed + 2} />
      <BoxInstances size={BRACKET} grain={0} items={layout.brackets} seed={p.seed + 3} />
      <LanternInstances kind="hanging" lanterns={layout.lanterns} size={LANTERN_SIZE} cord={LANTERN_CORD} intensity={6} />
      <Roof position={[0, WALL_HEIGHT + 0.25, -L / 2]} size={[CORRIDOR_WIDTH + 1.8, 1.25, L]} seed={p.seed} />
      <BoxInstances size={PIER} anchor="base" grain={1} items={layout.piers} seed={p.seed + 4} />
      {p.repeats > 0 && (
        <>
          <SlidingDoorPair
            z={-L + END_DOOR_INSET}
            y={WALL_SILL}
            width={END_DOOR_SIZE[0]}
            height={END_DOOR_SIZE[1]}
            roomSide={1}
            track={0.03}
            openAt={start + L - FALSE_EXIT_OPEN_BEFORE}
            seed={p.seed + 5}
          />
          <ShojiInstances size={END_TRANSOM_SIZE} kickboard={false} panels={layout.endTransom} seed={p.seed + 6} />
        </>
      )}
    </group>
  )
}
