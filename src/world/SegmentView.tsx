import type { Segment } from './segment'

/** Mounts one segment's component in its local frame (its start transform). */
export default function SegmentView<P>({ segment }: { segment: Segment<P> }) {
  const { Component, start } = segment
  return (
    <group position={[start.x, start.y, start.z]} rotation={[0, start.yaw, 0]}>
      <Component segment={segment} />
    </group>
  )
}
