import { wrapEffect } from '@react-three/postprocessing'
import { Effect } from 'postprocessing'
import { Color, Uniform } from 'three'
import { palette } from '../../lib/palette'

/** How bright the red is, for a given brightness of the scene before it (below 1 keeps the black deep). */
const RED_GAIN = 0.75

const fragmentShader = /* glsl */ `
uniform float amount;
uniform vec3 tint;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float luma = dot(inputColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  outputColor = vec4(mix(inputColor.rgb, luma * tint, amount), inputColor.a);
}
`

/**
 * The finale's grade: every light turns vermilion. Keeps each pixel's brightness and gives it the
 * accent's hue, so lanterns, paper and windows burn red while the void stays black. Runs before
 * tone mapping, on HDR values. `amount` 0 leaves the image untouched.
 */
export class RedShiftEffect extends Effect {
  constructor() {
    // The accent in linear space, scaled so its luminance is RED_GAIN: luma × tint keeps brightness.
    const tint = new Color(palette.vermilion)
    const luma = 0.2126 * tint.r + 0.7152 * tint.g + 0.0722 * tint.b
    tint.multiplyScalar(RED_GAIN / luma)
    super('RedShiftEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['amount', new Uniform(0)],
        ['tint', new Uniform(tint)],
      ]),
    })
  }

  get amount(): number {
    return this.uniforms.get('amount')!.value as number
  }

  set amount(value: number) {
    this.uniforms.get('amount')!.value = value
  }
}

export const RedShift = wrapEffect(RedShiftEffect)
