import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, type ShaderMaterial } from 'three'
import { palette } from '../../../lib/palette'
import type { GlowCloud } from './layout'

interface AbyssGlowProps {
  cloud: GlowCloud
  /** Average rise (m/s). 0 holds them still. Rising points wrap from `low` + `span` back to `low`. */
  rise?: number
  low?: number
  span?: number
  /** World-space diameter of one point. */
  size: number
  /** Color multiplier. Above ~1 they cross the bloom threshold and glow. */
  brightness: number
  /** 0 steady, 1 a strong ember flicker. */
  flicker: number
  /** Points fade in from a third of this distance to this distance… */
  near: number
  /** …and out from 60% of this one to this one. They ignore the fog. */
  far: number
}

const vertexShader = /* glsl */ `
  attribute vec3 aSeed;
  uniform float uTime;
  uniform float uRise;
  uniform float uLow;
  uniform float uSpan;
  uniform float uSize;
  uniform float uScale;
  uniform float uFlicker;
  uniform float uNear;
  uniform float uFar;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float edge = 1.0;
    if (uRise > 0.0) {
      float h = mod(p.y - uLow + uTime * uRise * mix(0.45, 1.55, aSeed.x), uSpan);
      p.y = uLow + h;
      p.x += sin(uTime * (0.1 + aSeed.y * 0.2) + aSeed.z * 6.2831853) * 0.8;
      p.z += cos(uTime * (0.08 + aSeed.z * 0.15) + aSeed.y * 6.2831853) * 0.8;
      // Fade in at the bottom of the wrap and out at the top, so it never pops.
      float u = h / uSpan;
      edge = smoothstep(0.0, 0.1, u) * (1.0 - smoothstep(0.85, 1.0, u));
    }
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = max(-mv.z, 0.001);
    float fade = smoothstep(uNear * 0.33, uNear, dist) * (1.0 - smoothstep(uFar * 0.6, uFar, dist));
    float flick = sin(uTime * (1.4 + aSeed.x * 4.0) + aSeed.z * 40.0) * sin(uTime * (0.9 + aSeed.y * 2.5) + aSeed.x * 17.0);
    vAlpha = edge * fade * mix(1.0, 0.6 + 0.4 * flick, uFlicker) * mix(0.35, 1.0, aSeed.y);
    gl_PointSize = min(uSize * mix(0.6, 1.4, aSeed.z) * uScale / dist, 32.0);
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
 * Lantern-colored points in the segment's frame: still, or rising and wrapping. All the motion
 * is in the vertex shader; the CPU only sets a few uniforms a frame. One draw call.
 */
export default function AbyssGlow({ cloud, rise = 0, low = 0, span = 1, size, brightness, flicker, near, far }: AbyssGlowProps) {
  const materialRef = useRef<ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRise: { value: 0 },
      uLow: { value: 0 },
      uSpan: { value: 1 },
      uSize: { value: 0 },
      uScale: { value: 1 },
      uFlicker: { value: 0 },
      uNear: { value: 1 },
      uFar: { value: 100 },
      uColor: { value: new Color() },
    }),
    [],
  )

  useEffect(() => {
    const u = materialRef.current?.uniforms
    if (!u) return
    u.uRise.value = rise
    u.uLow.value = low
    u.uSpan.value = span
    u.uSize.value = size
    u.uFlicker.value = flicker
    u.uNear.value = near
    u.uFar.value = far
    u.uColor.value.set(palette.lantern).multiplyScalar(brightness)
  }, [rise, low, span, size, flicker, near, far, brightness])

  useFrame((state) => {
    const material = materialRef.current
    if (!material) return
    const u = material.uniforms
    u.uTime.value = state.clock.elapsedTime
    // Same perspective scale three's PointsMaterial uses: half the drawing-buffer height.
    u.uScale.value = state.size.height * state.viewport.dpr * 0.5
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[cloud.positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[cloud.seeds, 3]} />
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
