import BoxInstances from '../../../scene/kit/BoxInstances'
import RoofInstances from '../../../scene/kit/RoofInstances'
import ShojiInstances from '../../../scene/kit/ShojiInstances'
import { ROOM_BEAM, ROOM_PANEL, ROOM_POST, ROOM_SLAB, SHAFT_ROOF, type ShaftLayout } from './shaftLayout'

interface InvertedRoomsProps {
  rooms: ShaftLayout['rooms']
  seed: number
}

/**
 * Rooms hung upside down in the shaft: floor slab on top, glowing shoji walls, and the roof
 * pointing down into the dark. Nine draw calls for all of them.
 */
export default function InvertedRooms({ rooms, seed }: InvertedRoomsProps) {
  return (
    <group>
      <BoxInstances size={ROOM_SLAB} grain={0} items={rooms.slabs} seed={seed} />
      <BoxInstances size={ROOM_POST} grain={1} items={rooms.posts} seed={seed + 1} />
      <BoxInstances size={ROOM_BEAM} grain={0} items={rooms.beams} seed={seed + 2} />
      {/* No kickboard: the panels read the same either way up. */}
      <ShojiInstances size={ROOM_PANEL} kickboard={false} panels={rooms.panels} seed={seed + 3} />
      <RoofInstances size={SHAFT_ROOF} items={rooms.roofs} seed={seed + 4} />
    </group>
  )
}
