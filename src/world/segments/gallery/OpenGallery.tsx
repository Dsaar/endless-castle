import { useMemo } from 'react'
import BoxInstances from '../../../scene/kit/BoxInstances'
import FloorPlanks from '../../../scene/kit/FloorPlanks'
import LanternInstances from '../../../scene/kit/LanternInstances'
import MergedBoxes from '../../../scene/kit/MergedBoxes'
import Roof from '../../../scene/kit/Roof'
import ShojiInstances from '../../../scene/kit/ShojiInstances'
import FloatingPavilion from '../../pieces/FloatingPavilion'
import type { SegmentProps } from '../../segment'
import { WALL_HEIGHT, WALL_PANEL_SIZE, WALL_POST, WALL_TRANSOM_SIZE } from '../shojiWall'
import {
  buildGalleryLayout,
  EAVE_HEIGHT,
  EAVE_POST,
  GALLERY_WIDTH,
  LANTERN_CORD,
  LANTERN_SIZE,
  LOW_RAIL,
  PIER,
  ROOF_RISE,
  TIE,
  TOP_RAIL,
  type GalleryParams,
} from './layout'

/**
 * The Open Gallery (engawa): a veranda with glowing shoji along one side and a low railing
 * open to the void on the other, under a roof whose underside slopes up from the eave.
 * Lanterns hang along the eave, and a pavilion or two float out in the dark.
 * About 20 draw calls, plus six per pavilion.
 */
export default function OpenGallery({ segment }: SegmentProps<GalleryParams>) {
  const p = segment.params
  const layout = useMemo(() => buildGalleryLayout(p), [p])
  const L = p.length

  return (
    <group>
      <FloorPlanks position={[0, 0, -L / 2]} rotation={[0, Math.PI / 2, 0]} size={[L, GALLERY_WIDTH]} seed={p.seed} />
      <MergedBoxes boxes={layout.boxes} seed={p.seed} />
      <BoxInstances size={[WALL_POST, WALL_HEIGHT, WALL_POST]} anchor="base" grain={1} items={layout.wallPosts} seed={p.seed} />
      <BoxInstances size={EAVE_POST} anchor="base" grain={1} items={layout.eavePosts} seed={p.seed + 1} />
      <ShojiInstances size={WALL_PANEL_SIZE} panels={layout.panels} seed={p.seed} />
      <ShojiInstances size={WALL_TRANSOM_SIZE} kickboard={false} panels={layout.transoms} seed={p.seed + 1} />
      <BoxInstances size={TIE} grain={0} items={layout.ties} seed={p.seed + 2} />
      <BoxInstances size={TOP_RAIL} grain={2} items={layout.topRails} seed={p.seed + 3} />
      <BoxInstances size={LOW_RAIL} grain={2} items={layout.lowRails} seed={p.seed + 4} />
      <LanternInstances kind="hanging" lanterns={layout.lanterns} size={LANTERN_SIZE} cord={LANTERN_CORD} intensity={8} />
      <Roof
        position={[layout.roofX, EAVE_HEIGHT + 0.3, -L / 2]}
        size={[(GALLERY_WIDTH + 1) * 2, ROOF_RISE, L]}
        seed={p.seed}
      />
      <BoxInstances size={PIER} anchor="base" grain={1} items={layout.piers} seed={p.seed + 5} />
      {p.pavilions.map((spec) => (
        <FloatingPavilion key={spec.seed} spec={spec} />
      ))}
    </group>
  )
}
