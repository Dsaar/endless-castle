import ShojiPanel from '../../../scene/kit/ShojiPanel'
import WoodBeam from '../../../scene/kit/WoodBeam'
import type { Vec3 } from '../../../scene/kit/types'

interface ShojiBayProps {
  /** Bottom center of the bay (top of its sill). */
  position: Vec3
  /** Clear width between the posts. */
  width: number
  /** Height of the sliding panels. */
  height: number
  /** Number of sliding panels across the bay. */
  panels?: number
  /** Height of a fixed transom (ranma) above a dividing beam; 0 for none. */
  transom?: number
}

const DIVIDER = 0.14

/** One bay of glowing shoji: a row of sliding panels, optionally with a lit transom above. */
export default function ShojiBay({ position, width, height, panels = 3, transom = 0 }: ShojiBayProps) {
  const pw = width / panels
  const [x, y, z] = position

  return (
    <group>
      {Array.from({ length: panels }, (_, i) => (
        <ShojiPanel key={i} position={[x - width / 2 + pw * (i + 0.5), y, z]} size={[pw, height]} />
      ))}
      {transom > 0 && (
        <>
          {/* The dividing beam (nageshi) and the lattice transom above it. */}
          <WoodBeam position={[x, y + height + DIVIDER / 2, z]} size={[width, DIVIDER, 0.16]} />
          <ShojiPanel position={[x, y + height + DIVIDER, z]} size={[width, transom]} kickboard={false} />
        </>
      )}
    </group>
  )
}
