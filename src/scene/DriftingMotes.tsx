import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, Vector3, type ShaderMaterial } from 'three'
import { palette } from '../lib/palette'
import { createRandom } from '../lib/random'

interface DriftingMotesProps {
  /** Number of particles. */
  count: number
  /** Size of the box around the camera that the particles live in, in world units [x, y, z]. */
  volume: [number, number, number]
  /** Average upward speed, units per second. */
  rise: number
  /** World-space diameter of one particle. */
  size: number
  /** Color multiplier. Above ~1 the particles cross the bloom threshold and glow. */
  brightness: number
  /** 0 = steady (dust), 1 = strong ember flicker. */
  flicker: number
  /** Seed for the particle layout. */
  seed: number
}

const vertexShader = /* glsl */ `
  attribute vec3 aSeed;
  uniform float uTime;
  uniform vec3 uCamera;
  uniform vec3 uVolume;
  uniform float uRise;
  uniform float uSize;
  uniform float uScale;
  uniform float uFlicker;
  varying float vAlpha;

  void main() {
    // Base position in [0, volume), then drift up with a gentle sideways sway.
    vec3 p = position * uVolume;
    float speed = mix(0.45, 1.55, aSeed.x) * uRise;
    p.y += uTime * speed;
    p.x += sin(uTime * (0.15 + aSeed.y * 0.25) + aSeed.z * 6.2831853) * 0.5;
    p.z += cos(uTime * (0.12 + aSeed.z * 0.2) + aSeed.y * 6.2831853) * 0.5;

    // Recycle: wrap into a box centred on the camera. A mote that leaves the top
    // re-enters at the bottom, so the cloud follows the viewer forever.
    vec3 halfVolume = 0.5 * uVolume;
    vec3 rel = mod(p - uCamera + halfVolume, uVolume) - halfVolume;
    vec3 world = uCamera + rel;

    // Fade near the box walls so recycling never pops.
    vec3 e = abs(rel) / halfVolume;
    float edge = 1.0 - smoothstep(0.65, 1.0, max(max(e.x, e.y), e.z));

    vec4 mvPosition = viewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float dist = max(-mvPosition.z, 0.001);

    // Don't let motes balloon right in front of the lens.
    float nearFade = smoothstep(0.25, 1.0, dist);

    float flick = sin(uTime * (2.0 + aSeed.x * 5.0) + aSeed.z * 40.0)
                * sin(uTime * (1.3 + aSeed.y * 3.0) + aSeed.x * 17.0);
    float flickerAmt = mix(1.0, 0.6 + 0.4 * flick, uFlicker);

    vAlpha = edge * nearFade * flickerAmt * mix(0.4, 1.0, aSeed.y);
    gl_PointSize = min(uSize * mix(0.5, 1.4, aSeed.z) * uScale / dist, 48.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float glow = pow(max(1.0 - d, 0.0), 2.0);
    gl_FragColor = vec4(uColor * glow * vAlpha, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

/**
 * Amber particles in a box that follows the camera, drifting slowly upward.
 * All motion and recycling happen in the vertex shader; the CPU only updates a few uniforms.
 */
export default function DriftingMotes({ count, volume, rise, size, brightness, flicker, seed }: DriftingMotesProps) {
  const materialRef = useRef<ShaderMaterial>(null)

  const { positions, seeds } = useMemo(() => {
    const rand = createRandom(seed)
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i++) {
      positions[i] = rand()
      seeds[i] = rand()
    }
    return { positions, seeds }
  }, [count, seed])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCamera: { value: new Vector3() },
      uVolume: { value: new Vector3() },
      uRise: { value: 0 },
      uSize: { value: 0 },
      uScale: { value: 1 },
      uFlicker: { value: 0 },
      uColor: { value: new Color() },
    }),
    [],
  )

  // Props can change without rebuilding the material. Runs before the first frame renders.
  const [vx, vy, vz] = volume
  useEffect(() => {
    const u = materialRef.current?.uniforms
    if (!u) return
    u.uVolume.value.set(vx, vy, vz)
    u.uRise.value = rise
    u.uSize.value = size
    u.uFlicker.value = flicker
    u.uColor.value.set(palette.lantern).multiplyScalar(brightness)
  }, [vx, vy, vz, rise, size, flicker, brightness])

  useFrame((state) => {
    const material = materialRef.current
    if (!material) return
    const u = material.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uCamera.value.copy(state.camera.position)
    // Same perspective scale three's PointsMaterial uses: half the drawing-buffer height.
    u.uScale.value = state.size.height * state.viewport.dpr * 0.5
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        blending={AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </points>
  )
}
