import type { Material } from 'three'

export interface DistantHazeOptions {
  /**
   * Multiplier on the scene's FogExp2 density for this material. Below 1, far landmarks stay
   * faintly visible at distances where the normal fog would have swallowed them.
   */
  densityScale: number
  /** World height below which the material is fully fogged... */
  bankBottom: number
  /** ...fading to no extra fog at this height: a fog bank that hides the bases of things. */
  bankTop: number
}

/**
 * Swaps a material's fog for a thinner "distant haze" that still follows the scene fog's
 * color and (live) density, plus a low fog bank by world height. For far scenery only:
 * near objects must use the normal fog so everything fades consistently.
 *
 * Works with any built-in material (and InstancedMesh). Materials with the same options
 * share one shader program.
 */
export function applyDistantHaze<T extends Material>(material: T, options: DistantHazeOptions): T {
  const { densityScale, bankBottom, bankTop } = options

  material.onBeforeCompile = (shader) => {
    shader.uniforms.hazeScale = { value: densityScale }
    shader.uniforms.hazeBank = { value: [bankBottom, bankTop] }

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vHazeY;')
      .replace(
        '#include <fog_vertex>',
        /* glsl */ `#include <fog_vertex>
        vec4 hazeWorld = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          hazeWorld = instanceMatrix * hazeWorld;
        #endif
        vHazeY = (modelMatrix * hazeWorld).y;`,
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying float vHazeY;\nuniform float hazeScale;\nuniform vec2 hazeBank;',
      )
      .replace(
        '#include <fog_fragment>',
        /* glsl */ `#if defined( USE_FOG ) && defined( FOG_EXP2 )
          float hazeD = fogDensity * hazeScale * vFogDepth;
          float hazeF = 1.0 - exp( -hazeD * hazeD );
          hazeF = max( hazeF, 1.0 - smoothstep( hazeBank.x, hazeBank.y, vHazeY ) );
          gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, hazeF );
        #else
          #include <fog_fragment>
        #endif`,
      )
  }
  material.customProgramCacheKey = () => `distant-haze:${densityScale}:${bankBottom}:${bankTop}`
  return material
}
