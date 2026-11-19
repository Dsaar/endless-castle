import { useEffect, useRef } from 'react'
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode, type BloomEffect } from 'postprocessing'
import { useShallow } from 'zustand/react/shallow'
import { ATMOSPHERE_DEFAULTS, useAtmosphereStore } from '../state/useAtmosphereStore'

/**
 * Bloom → ACES tone mapping → vignette → film grain.
 *
 * The scene renders into a half-float buffer, so emissive values above 1 survive until bloom.
 * EffectComposer forces the renderer's own tone mapping off while mounted, so ACES is
 * applied here by the ToneMapping effect rather than by the renderer.
 */
export default function PostEffects() {
  const bloomRef = useRef<BloomEffect>(null)
  const { bloomIntensity, bloomThreshold, bloomSmoothing, bloomRadius } = useAtmosphereStore(
    useShallow((s) => ({
      bloomIntensity: s.bloomIntensity,
      bloomThreshold: s.bloomThreshold,
      bloomSmoothing: s.bloomSmoothing,
      bloomRadius: s.bloomRadius,
    })),
  )

  // Threshold, smoothing and radius are constructor options; passing them as props would
  // rebuild the effect on every change. Set them live on the existing effect instead.
  useEffect(() => {
    const bloom = bloomRef.current
    if (!bloom) return
    bloom.luminanceMaterial.threshold = bloomThreshold
    bloom.luminanceMaterial.smoothing = bloomSmoothing
    bloom.mipmapBlurPass.radius = bloomRadius
  }, [bloomThreshold, bloomSmoothing, bloomRadius])

  return (
    <EffectComposer multisampling={4}>
      <Bloom
        ref={bloomRef}
        mipmapBlur
        luminanceThreshold={ATMOSPHERE_DEFAULTS.bloomThreshold}
        luminanceSmoothing={ATMOSPHERE_DEFAULTS.bloomSmoothing}
        radius={ATMOSPHERE_DEFAULTS.bloomRadius}
        intensity={bloomIntensity}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.3} darkness={0.7} />
      <Noise opacity={0.04} />
    </EffectComposer>
  )
}
