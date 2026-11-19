import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, type Points, type ShaderMaterial } from 'three'
import { palette } from '../lib/palette'
import { createRandom } from '../lib/random'

const COUNT = 2000
const RADIUS = 600

const vertexShader = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  attribute float aBrightness;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Slow twinkle: each star has its own speed and phase.
    float speed = 0.25 + fract(aPhase * 7.13) * 0.9;
    float twinkle = 0.6 + 0.4 * sin(uTime * speed + aPhase * 6.2831853);
    vAlpha = aBrightness * twinkle;

    gl_PointSize = aSize * uPixelRatio;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float disc = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor * vAlpha * disc, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

/**
 * ~2000 tiny warm-white points on a huge sphere centred on the camera, so they read as
 * infinitely far away. Unaffected by fog; the twinkle runs entirely in the shader.
 */
export default function Starfield() {
  const pointsRef = useRef<Points>(null)
  const materialRef = useRef<ShaderMaterial>(null)

  const { positions, phases, sizes, brightness } = useMemo(() => {
    const rand = createRandom(1)
    const positions = new Float32Array(COUNT * 3)
    const phases = new Float32Array(COUNT)
    const sizes = new Float32Array(COUNT)
    const brightness = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      // Uniform direction on the sphere.
      const z = rand() * 2 - 1
      const theta = rand() * Math.PI * 2
      const r = Math.sqrt(1 - z * z)
      const dist = RADIUS * (0.9 + rand() * 0.1)
      positions[i * 3] = r * Math.cos(theta) * dist
      positions[i * 3 + 1] = z * dist
      positions[i * 3 + 2] = r * Math.sin(theta) * dist
      phases[i] = rand()
      // Most stars are faint pin-pricks; a few are brighter.
      const t = rand()
      sizes[i] = 1 + t * t * 2.2
      brightness[i] = 0.15 + Math.pow(rand(), 3) * 0.9
    }
    return { positions, phases, sizes, brightness }
  }, [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uColor: { value: new Color(palette.shoji) },
    }),
    [],
  )

  useFrame((state) => {
    // Keep the sphere centred on the viewer, like a sky.
    pointsRef.current?.position.copy(state.camera.position)
    const material = materialRef.current
    if (!material) return
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uPixelRatio.value = state.viewport.dpr
  })

  return (
    <points ref={pointsRef} frustumCulled={false} renderOrder={-1}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aBrightness" args={[brightness, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        blending={AdditiveBlending}
        transparent
        depthWrite={false}
        fog={false}
      />
    </points>
  )
}
