import { useMemo } from 'react'
import BoxInstances from '../../../scene/kit/BoxInstances'
import HangingScroll from '../../../scene/kit/HangingScroll'
import LanternInstances from '../../../scene/kit/LanternInstances'
import { getPlasterMaterial } from '../../../scene/kit/materials'
import MergedBoxes from '../../../scene/kit/MergedBoxes'
import ShojiInstances from '../../../scene/kit/ShojiInstances'
import TatamiFloor from '../../../scene/kit/TatamiFloor'
import type { SegmentProps } from '../../segment'
import {
  BATTEN_SIZE,
  buildTatamiLayout,
  DOOR_HEIGHT,
  END_WALL_INSET,
  HANGING_CORD,
  PIER,
  ROOM_HEIGHT,
  ROOM_POST,
  ROOM_SILL,
  TRACK,
  TRANSOM_HEIGHT,
  type TatamiParams,
} from './layout'
import SlidingDoorPair from './SlidingDoorPair'

/** The far doors slide open once the player is this far into the room (share of its depth). */
const OPEN_AT = 0.3

/**
 * The Tatami Room: a square room of mats, glowing shoji and plaster walls, floor lanterns in
 * the corners and a vermilion hanging scroll. Its far doors slide open as the player crosses
 * it, onto the next room, which is almost the same one: the scroll has moved, a lantern is
 * gone. Runs of two to four.
 */
export default function TatamiRoom({ segment }: SegmentProps<TatamiParams>) {
  const p = segment.params
  const layout = useMemo(() => buildTatamiLayout(p), [p])
  const S = p.size
  const door = { y: ROOM_SILL, width: layout.panelWidth, height: DOOR_HEIGHT, track: TRACK, seed: p.seed }

  return (
    <group>
      {/* Same seed every room of a run: the same mats. */}
      <TatamiFloor position={[0, 0, -S / 2]} size={[S, S]} seed={p.seed} />
      <MergedBoxes boxes={layout.boxes} seed={p.seed} />
      <MergedBoxes boxes={layout.plaster} material={getPlasterMaterial()} seed={p.seed + 1} />
      <BoxInstances size={[ROOM_POST, ROOM_HEIGHT, ROOM_POST]} anchor="base" grain={1} items={layout.posts} seed={p.seed} />
      <ShojiInstances size={[layout.panelWidth, DOOR_HEIGHT]} panels={layout.panels} seed={p.seed} />
      <ShojiInstances size={[layout.transomWidth, TRANSOM_HEIGHT]} kickboard={false} panels={layout.transoms} seed={p.seed + 1} />
      <BoxInstances size={[S, BATTEN_SIZE, BATTEN_SIZE]} grain={0} items={layout.battens} seed={p.seed + 2} />
      <BoxInstances size={PIER} anchor="base" grain={1} items={layout.piers} seed={p.seed + 3} />

      {p.entryWall && <SlidingDoorPair z={-END_WALL_INSET} roomSide={-1} {...door} />}
      <SlidingDoorPair z={-S + END_WALL_INSET} roomSide={1} openAt={segment.startDistance + S * OPEN_AT} {...door} />

      <LanternInstances kind="standing" lanterns={layout.standing} size={1} intensity={5} />
      <LanternInstances kind="hanging" lanterns={layout.hanging} size={1} cord={HANGING_CORD} intensity={7} />
      <HangingScroll position={layout.scroll.position} rotation={[0, layout.scroll.yaw, 0]} />
    </group>
  )
}
