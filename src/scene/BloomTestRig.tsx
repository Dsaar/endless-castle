import { useMemo } from 'react'
import { Color } from 'three'
import { palette } from '../lib/palette'

/**
 * Temporary test objects for judging bloom and fog: a backlit shoji-cream panel,
 * one amber point light with a small visible bulb, and a dark cedar floor for the light to fall on.
 * Replaced by the real castle in step 4+.
 */
export default function BloomTestRig() {
  // Basic materials ignore lighting; pushing the color above 1 makes the bulb bloom hard.
  const bulbColor = useMemo(() => new Color(palette.lantern).multiplyScalar(4), [])

  return (
    <group>
      <mesh position={[0, 1.6, 0]}>
        <planeGeometry args={[1.2, 1.8]} />
        <meshStandardMaterial
          color={palette.shoji}
          emissive={palette.shoji}
          emissiveIntensity={0.9}
          roughness={0.9}
        />
      </mesh>

      <group position={[1.5, 1.1, 1.2]}>
        <pointLight color={palette.lantern} intensity={8} distance={14} decay={2} />
        <mesh>
          <sphereGeometry args={[0.05, 16, 12]} />
          <meshBasicMaterial color={bulbColor} />
        </mesh>
      </group>

      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={palette.cedarDark} roughness={0.85} />
      </mesh>
    </group>
  )
}
