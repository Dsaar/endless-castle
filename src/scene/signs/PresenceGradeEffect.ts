import { wrapEffect } from '@react-three/postprocessing'
import { Effect } from 'postprocessing'
import { Uniform, Vector3 } from 'three'
import type { PresenceFx } from './presenceFx'
import { PRESENCE_DESATURATION, RIPPLE_DARK, RIPPLE_WIDTH } from './tuning'

const fragmentShader = /* glsl */ `
uniform float amount;
uniform float desaturation;
uniform vec3 ripple;
uniform float rippleStrength;
uniform float rippleWidth;
uniform float rippleDark;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 color = inputColor.rgb;
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(color, vec3(luma), desaturation * amount);

  // The ripple: a dark front rolling outward, with a fading wake behind it.
  vec2 q = (uv - ripple.xy) * vec2(aspect, 1.0);
  float x = (length(q) - ripple.z) / rippleWidth;
  float front = exp(-x * x);
  float wake = x < 0.0 ? 0.45 * exp(x * 0.5) : 0.0;
  color *= 1.0 - rippleDark * rippleStrength * clamp(front + wake, 0.0, 1.0);

  outputColor = vec4(color, inputColor.a);
}
`

/**
 * The presence's grade, after tone mapping: color drains out as the presence grows, and the
 * dark ripple rolls across the view (lanterns and their bloom darken with it, the void stays
 * black). Both are 0 the rest of the time, and then it changes nothing.
 */
export class PresenceGradeEffect extends Effect {
  constructor() {
    super('PresenceGradeEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['amount', new Uniform(0)],
        ['desaturation', new Uniform(PRESENCE_DESATURATION)],
        ['ripple', new Uniform(new Vector3(0.5, 0.5, 0))],
        ['rippleStrength', new Uniform(0)],
        ['rippleWidth', new Uniform(RIPPLE_WIDTH)],
        ['rippleDark', new Uniform(RIPPLE_DARK)],
      ]),
    })
  }

  /** Copies this frame's presence into the uniforms. */
  sync(fx: PresenceFx) {
    const u = this.uniforms
    u.get('amount')!.value = fx.level
    ;(u.get('ripple')!.value as Vector3).set(fx.rippleX, fx.rippleY, fx.rippleRadius)
    u.get('rippleStrength')!.value = fx.rippleStrength
  }
}

export const PresenceGrade = wrapEffect(PresenceGradeEffect)
