import { useMemo } from 'react'
import { useForkStore } from '../../../state/useForkStore'
import type { SegmentProps } from '../../segment'
import Hall from '../hall/Hall'
import HallDoors from '../hall/HallDoors'
import { buildHallLayout, type HallParams } from '../hall/layout'

/**
 * The Forking Hall: the walk stops in the middle and asks which way (left, straight or right).
 * Every doorway has a pair of sliding shoji, open as you come in. Once you choose, the doors
 * of the two ways you didn't take slide shut. The entrance stays open behind you.
 */
export default function JunctionHall({ segment }: SegmentProps<HallParams>) {
  const p = segment.params
  const layout = useMemo(() => buildHallLayout(p), [p])
  const chosen = useForkStore((s) => s.chosen[segment.id])

  return (
    <group>
      <Hall params={p} layout={layout} />
      {layout.doorways.map((doorway, i) => (
        <HallDoors
          key={doorway.side}
          doorway={doorway}
          closed={chosen !== undefined && doorway.side !== 'entry' && doorway.side !== chosen}
          seed={p.seed + 10 + i * 2}
        />
      ))}
    </group>
  )
}
