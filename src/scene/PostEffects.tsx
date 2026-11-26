import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode, type BloomEffect, type VignetteEffect } from 'postprocessing'
import { useShallow } from 'zustand/react/shallow'
import { finaleFx } from '../state/finaleFx'
import { ATMOSPHERE_DEFAULTS, useAtmosphereStore } from '../state/useAtmosphereStore'
import { fallFx, fallIntensity } from './fall/fallFx'
import { RedShift, type RedShiftEffect } from './finale/RedShiftEffect'
import { PresenceGrade, type PresenceGradeEffect } from './signs/PresenceGradeEffect'
import { PresenceWarp, type PresenceWarpEffect } from './signs/PresenceWarpEffect'
import { presenceFx } from './signs/presenceFx'
import {
  HEARTBEAT_VIGNETTE,
  PRESENCE_VIGNETTE_DARKNESS,
  PRESENCE_VIGNETTE_OFFSET,
  REDUCED_MOTION_WARP,
} from './signs/tuning'
import {
  FALL_VIGNETTE_DARKNESS,
  FALL_VIGNETTE_OFFSET,
  VIGNETTE_DARKNESS,
  VIGNETTE_OFFSET,
} from './fall/tuning'

/**
 * The presence's warp → bloom → the finale's red → ACES tone mapping → the presence's grade →
 * vignette → film grain. All of it runs in one pass: the warp is the only effect that reads
 * the frame at other points (a convolution), and it comes first, where that frame is whole.
 *
 * The scene renders into a half-float buffer, so emissive values above 1 survive until bloom.
 * EffectComposer forces the renderer's own tone mapping off while mounted, so ACES is
 * applied here by the ToneMapping effect rather than by the renderer.
 *
 * The vignette closes in with the speed of THE FALL (`fallFx`), and with a hidden figure's
 * presence (`presenceFx`, pulsing with its heartbeat), set on the effect each frame. The
 * presence also drives the rim's warp and color split, the desaturation and the dark ripple.
 * The red grade follows `finaleFx.red` (0 the rest of the time: it changes nothing).
 */
export default function PostEffects() {
  const bloomRef = useRef<BloomEffect>(null)
  const vignetteRef = useRef<VignetteEffect>(null)
  const redRef = useRef<RedShiftEffect>(null)
  const warpRef = useRef<PresenceWarpEffect>(null)
  const gradeRef = useRef<PresenceGradeEffect>(null)
  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
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

  useEffect(() => {
    if (warpRef.current) warpRef.current.still = reducedMotion
  }, [reducedMotion])

  useFrame(() => {
    if (redRef.current) redRef.current.amount = finaleFx.red
    warpRef.current?.sync(presenceFx, reducedMotion ? REDUCED_MOTION_WARP : 1)
    gradeRef.current?.sync(presenceFx)
    const vignette = vignetteRef.current
    if (!vignette) return
    // The Fall and a presence never overlap; each adds its own change to the base.
    const k = fallIntensity(fallFx.speed)
    const p = presenceFx.level
    vignette.offset =
      VIGNETTE_OFFSET + (FALL_VIGNETTE_OFFSET - VIGNETTE_OFFSET) * k + (PRESENCE_VIGNETTE_OFFSET - VIGNETTE_OFFSET) * p
    vignette.darkness =
      VIGNETTE_DARKNESS +
      (FALL_VIGNETTE_DARKNESS - VIGNETTE_DARKNESS) * k +
      (PRESENCE_VIGNETTE_DARKNESS - VIGNETTE_DARKNESS) * p +
      HEARTBEAT_VIGNETTE * presenceFx.pulse
  })

  return (
    <EffectComposer multisampling={4}>
      <PresenceWarp ref={warpRef} />
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
      <PresenceGrade ref={gradeRef} />
      <Vignette ref={vignetteRef} offset={VIGNETTE_OFFSET} darkness={VIGNETTE_DARKNESS} />
      <Noise opacity={0.04} />
    </EffectComposer>
  )
}
