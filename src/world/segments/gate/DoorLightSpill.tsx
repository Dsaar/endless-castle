import { getUnitPlane } from '../../../scene/kit/geometry'
import { getSpillMaterial, SPILL_LENGTH } from './doorSpillMaterial'

interface DoorLightSpillProps {
  /** Width of the doorway the light comes from. */
  width: number
}

/**
 * A streak of light on the floor in front of closed doors, as if leaking from the slit
 * between them. Additive and unlit, so it costs no light. `position` is the door line.
 */
export default function DoorLightSpill({ width }: DoorLightSpillProps) {
  return (
    <mesh
      geometry={getUnitPlane()}
      material={getSpillMaterial()}
      // Flat on the floor; the plane's top edge (the mask's door end) points back to the doors.
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.006, SPILL_LENGTH / 2 + 0.05]}
      scale={[width, SPILL_LENGTH, 1]}
      renderOrder={1}
    />
  )
}
