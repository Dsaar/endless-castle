import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  Color,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  type Mesh,
  type ShaderMaterial,
} from 'three'
import { palette } from '../../lib/palette'
import { createRandom } from '../../lib/random'
import { useDisposable } from '../kit/useDisposable'
import { fallFx, fallIntensity } from './fallFx'

/** How many streaks, and the box around the camera they live in (meters). */
const COUNT = 260
const VOLUME: [number, number, number] = [12, 36, 12]
/** Streak length at rest and at top speed (meters), and width. */
const MIN_LENGTH = 0.2
const MAX_LENGTH = 3.4
const WIDTH = 0.025
/** Color multiplier: well over the bloom threshold. */
const BRIGHTNESS = 3
/** Drawn (at zero intensity, adding nothing) for this many frames at load, so the shader compiles then and not as the fall begins. */
const WARMUP_FRAMES = 3

const vertexShader = /* glsl */ `
  attribute vec3 aOffset;
  attribute vec3 aSeed;
  uniform float uTime;
  uniform vec3 uVolume;
  uniform float uLength;
  uniform float uWidth;
  uniform float uIntensity;
  varying float vAlong;
  varying float vAcross;
  varying float vAlpha;

  void main() {
    // A spark in a box that follows the camera, rising slowly. The camera falling through
    // the box is what makes the streaks rush upward.
    vec3 p = aOffset * uVolume;
    p.y += uTime * mix(0.6, 1.8, aSeed.x);
    vec3 halfVolume = 0.5 * uVolume;
    vec3 rel = mod(p - cameraPosition + halfVolume, uVolume) - halfVolume;
    vec3 head = cameraPosition + rel;

    // A vertical streak trailing below its head, turned about its own axis to face the camera.
    float len = uLength * mix(0.6, 1.4, aSeed.y);
    vec3 tail = head - vec3(0.0, len, 0.0);
    vec3 side = cross(vec3(0.0, 1.0, 0.0), cameraPosition - head);
    float sideLength = length(side);
    side = sideLength > 1e-3 ? side / sideLength : vec3(1.0, 0.0, 0.0);
    vec3 world = mix(tail, head, position.y) + side * position.x * uWidth * mix(0.6, 1.3, aSeed.z);

    vec4 mvPosition = viewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Fade near the box walls (so recycling never pops) and right in front of the lens.
    vec3 e = abs(rel) / halfVolume;
    float edge = 1.0 - smoothstep(0.6, 1.0, max(max(e.x, e.y), e.z));
    float nearFade = smoothstep(0.4, 1.5, -mvPosition.z);

    vAlong = position.y;
    vAcross = position.x;
    vAlpha = edge * nearFade * uIntensity * mix(0.35, 1.0, aSeed.z);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlong;
  varying float vAcross;
  varying float vAlpha;

  void main() {
    // Bright at the head, fading down the tail and toward the edges. Clamped: interpolation
    // can dip just below 0, pow() of that is NaN, and bloom would spread a NaN over the frame.
    float across = clamp(1.0 - abs(vAcross), 0.0, 1.0);
    float alpha = vAlpha * pow(clamp(vAlong, 0.0, 1.0), 1.6) * across * across;
    gl_FragColor = vec4(uColor * alpha, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

/**
 * Embers streaking upward past the camera during THE FALL, longer and brighter the faster it
 * goes (`fallFx`). One instanced draw call; hidden whenever the player isn't falling. All the
 * motion and recycling happen in the vertex shader.
 */
export default function FallStreaks() {
  const meshRef = useRef<Mesh>(null)
  const materialRef = useRef<ShaderMaterial>(null)
  const frames = useRef(0)

  const geometry = useDisposable(() => {
    const g = new InstancedBufferGeometry()
    // A unit quad: x across (-1 … 1), y along (0 tail … 1 head).
    g.setAttribute('position', new BufferAttribute(new Float32Array([-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0]), 3))
    g.setIndex([0, 1, 2, 2, 1, 3])
    const rand = createRandom(11)
    const offsets = new Float32Array(COUNT * 3)
    const seeds = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT * 3; i++) {
      offsets[i] = rand()
      seeds[i] = rand()
    }
    g.setAttribute('aOffset', new InstancedBufferAttribute(offsets, 3))
    g.setAttribute('aSeed', new InstancedBufferAttribute(seeds, 3))
    g.instanceCount = COUNT
    return g
  }, [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uVolume: { value: VOLUME },
      uLength: { value: MIN_LENGTH },
      uWidth: { value: WIDTH },
      uIntensity: { value: 0 },
      uColor: { value: new Color(palette.lantern).multiplyScalar(BRIGHTNESS) },
    }),
    [],
  )

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    const material = materialRef.current
    if (!mesh || !material) return
    const speed = fallFx.speed
    const warming = frames.current < WARMUP_FRAMES
    if (warming) frames.current++
    mesh.visible = warming || speed > 0.005
    if (!mesh.visible) return
    const u = material.uniforms
    u.uTime.value = clock.elapsedTime
    u.uLength.value = MIN_LENGTH + (MAX_LENGTH - MIN_LENGTH) * speed
    u.uIntensity.value = fallIntensity(speed)
  })

  return (
    <mesh ref={meshRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        blending={AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}
