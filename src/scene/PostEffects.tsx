import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode, type BloomEffect, type VignetteEffect } from 'postprocessing'
import { useShallow } from 'zustand/react/shallow'
import { finaleFx } from '../state/finaleFx'
import { ATMOSPHERE_DEFAULTS, useAtmosphereStore } from '../state/useAtmosphereStore'
import { fallFx, fallIntensity } from './fall/fallFx'
import { RedShift, type RedShiftEffect } from './finale/RedShiftEffect'
import {
  FALL_VIGNETTE_DARKNESS,
  FALL_VIGNETTE_OFFSET,
  VIGNETTE_DARKNESS,
  VIGNETTE_OFFSET,
} from './fall/tuning'

/**
 * Bloom → the finale's red → ACES tone mapping → vignette → film grain.
 *
 * The scene renders into a half-float buffer, so emissive values above 1 survive until bloom.
 * EffectComposer forces the renderer's own tone mapping off while mounted, so ACES is
 * applied here by the ToneMapping effect rather than by the renderer.
 *
 * The vignette closes in with the speed of THE FALL (`fallFx`), set on the effect each frame.
 * The red grade follows `finaleFx.red` (0 the rest of the time: it changes nothing).
 */
export default function PostEffects() {
  const bloomRef = useRef<BloomEffect>(null)
  const vignetteRef = useRef<VignetteEffect>(null)
  const redRef = useRef<RedShiftEffect>(null)
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

  useFrame(() => {
    if (redRef.current) redRef.current.amount = finaleFx.red
    const vignette = vignetteRef.current
    if (!vignette) return
    const k = fallIntensity(fallFx.speed)
    vignette.offset = VIGNETTE_OFFSET + (FALL_VIGNETTE_OFFSET - VIGNETTE_OFFSET) * k
    vignette.darkness = VIGNETTE_DARKNESS + (FALL_VIGNETTE_DARKNESS - VIGNETTE_DARKNESS) * k
  })

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
      <RedShift ref={redRef} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette ref={vignetteRef} offset={VIGNETTE_OFFSET} darkness={VIGNETTE_DARKNESS} />
      <Noise opacity={0.04} />
    </EffectComposer>
  )
}
