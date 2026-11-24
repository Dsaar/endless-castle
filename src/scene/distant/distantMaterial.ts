import { MeshBasicMaterial, type MeshBasicMaterialParameters } from 'three'

/**
 * Seconds, shared by every distant-castle material. `DistantCastle` sets it once per frame:
 * all motion and fading runs on the GPU from it.
 */
export const distantTime = { value: 0 }

/** Sway rate of drifting rooms (rad/s): one swing about every 80 s. */
const DRIFT_RATE = 0.078
/** Pieces fade in from the fog over this long when they appear, and out when they are removed (s). */
export const LIFE_FADE = 2.5
/**
 * Multiplier on the scene's FogExp2 density. The near castle is gone by about 60 m; at this
 * scale the distant one is half hidden at 100 m and has all but dissolved by 250 m.
 */
const HAZE_SCALE = 0.26

/** Distances (m) over which a material fades in from the fog, then back out. */
export interface DistanceFade {
  nearStart: number
  nearEnd: number
  farStart: number
  farEnd: number
}

/**
 * An unlit material for the distant castle, patched to read two per-instance attributes:
 *
 * - `aPivot` (x, z, born, dies): the piece's turning axis, and when it appeared and when it
 *   goes (seconds of `distantTime`), for a fade in and out of the fog.
 * - `aMotion` (spin, drift, heading, phase): turn rate about the pivot (rad/s), and a sideways
 *   sway of `drift` meters along `heading`. Zero for pieces that hold still.
 *
 * Every vertex also fades with its distance from the camera (`fade`), so pieces dissolve
 * into the fog at both ends of their range and never pop in or out. The fog itself is the
 * scene's FogExp2 thinned by HAZE_SCALE, following its live density.
 */
export function createDistantMaterial(params: MeshBasicMaterialParameters, fade: DistanceFade) {
  const material = new MeshBasicMaterial(params)
  const fadeRange = [fade.nearStart, fade.nearEnd, fade.farStart, fade.farEnd]

  material.onBeforeCompile = (shader) => {
    shader.uniforms.dcTime = distantTime
    shader.uniforms.dcFade = { value: fadeRange }
    shader.uniforms.dcHaze = { value: HAZE_SCALE }

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        attribute vec4 aPivot;
        attribute vec4 aMotion;
        uniform float dcTime;
        uniform vec4 dcFade;
        varying float vDcFade;`,
      )
      .replace(
        '#include <project_vertex>',
        /* glsl */ `vec4 mvPosition = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        // Turn about the vertical through the pivot, then sway sideways.
        float dcAngle = aMotion.x * dcTime;
        float dcS = sin( dcAngle );
        float dcC = cos( dcAngle );
        vec2 dcRel = mvPosition.xz - aPivot.xy;
        mvPosition.xz = aPivot.xy + vec2( dcC * dcRel.x + dcS * dcRel.y, dcC * dcRel.y - dcS * dcRel.x );
        mvPosition.xz += aMotion.y * sin( dcTime * ${DRIFT_RATE.toFixed(4)} + aMotion.w ) * vec2( cos( aMotion.z ), sin( aMotion.z ) );
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;

        float dcDist = length( mvPosition.xyz );
        float dcLife = clamp( ( dcTime - aPivot.z ) / ${LIFE_FADE.toFixed(2)}, 0.0, 1.0 )
          * clamp( ( aPivot.w - dcTime ) / ${LIFE_FADE.toFixed(2)}, 0.0, 1.0 );
        vDcFade = smoothstep( dcFade.x, dcFade.y, dcDist ) * ( 1.0 - smoothstep( dcFade.z, dcFade.w, dcDist ) ) * dcLife;`,
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        uniform float dcHaze;
        varying float vDcFade;`,
      )
      .replace(
        '#include <fog_fragment>',
        /* glsl */ `#if defined( USE_FOG ) && defined( FOG_EXP2 )
          float dcD = fogDensity * dcHaze * vFogDepth;
          // What the haze lets through, times the fade.
          float dcFog = 1.0 - exp( - dcD * dcD ) * vDcFade;
          gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, dcFog );
        #elif defined( USE_FOG )
          #include <fog_fragment>
        #else
          gl_FragColor.rgb *= vDcFade;
        #endif`,
      )
  }
  // One program per set of defines; the fade range is a uniform.
  material.customProgramCacheKey = () => 'distant-castle'
  return material
}
