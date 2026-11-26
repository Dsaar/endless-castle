import { wrapEffect } from '@react-three/postprocessing'
import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform, Vector3, type WebGLRenderer, type WebGLRenderTarget } from 'three'
import type { PresenceFx } from './presenceFx'
import { EDGE_ABERRATION, EDGE_WARP, EDGE_WAVE_SPEED, RIPPLE_WARP, RIPPLE_WIDTH } from './tuning'

const fragmentShader = /* glsl */ `
uniform float amount;
uniform float phase;
uniform float warp;
uniform float aberration;
uniform vec3 ripple;
uniform float rippleStrength;
uniform float rippleWidth;
uniform float rippleWarp;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (amount <= 0.0 && rippleStrength <= 0.0) {
    outputColor = inputColor;
    return;
  }

  // -1 … 1 across the screen; only the rim moves, most of all in the corners.
  vec2 c = uv * 2.0 - 1.0;
  float r = length(c);
  vec2 dir = r > 1e-4 ? c / r : vec2(0.0);
  float edge = smoothstep(0.3, 1.25, r);

  // A slow wave running round the rim, breathing in and out. Integer multiples of the angle
  // keep it seamless where atan wraps. It always pulls inward, so nothing is read off screen.
  float a = atan(c.y, c.x);
  float wave = 0.5 + 0.25 * sin(phase * 0.8 + a * 3.0 + r * 5.0) + 0.25 * sin(phase * 1.3 - a * 5.0 + 1.7);
  vec2 offset = -dir * edge * wave * warp * amount;

  // The ripple's front bends the image a little as it passes.
  vec2 q = (uv - ripple.xy) * vec2(aspect, 1.0);
  float d = length(q);
  float x = (d - ripple.z) / rippleWidth;
  float band = exp(-x * x) * rippleStrength;
  vec2 outward = d > 1e-4 ? (q / d) * vec2(1.0 / aspect, 1.0) : vec2(0.0);
  offset += outward * band * rippleWarp;

  // Red stays put, green and blue are drawn in toward the middle: fringes at the rim.
  vec2 split = dir * (edge * edge * aberration * amount + band * 0.4 * aberration);
  vec2 st = uv + offset;
  float red = texture2D(inputBuffer, st).r;
  vec4 green = texture2D(inputBuffer, st - split * 0.5);
  float blue = texture2D(inputBuffer, st - split).b;
  outputColor = vec4(red, green.g, blue, green.a);
}
`

/**
 * The presence's warp, the first effect in the chain: the screen's rim waves slowly in and out
 * and its colors split apart (chromatic aberration), more the stronger the presence. The dark
 * ripple's front also bends the image as it passes. Reads the scene buffer at shifted points,
 * so it is a convolution effect: it must come first, where `inputBuffer` is the whole frame.
 * With `amount` and the ripple at 0 it passes the frame through untouched.
 */
export class PresenceWarpEffect extends Effect {
  /** Reduced motion: hold the wave still (the warp itself is scaled down by the caller). */
  still = false

  constructor() {
    super('PresenceWarpEffect', fragmentShader, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ['amount', new Uniform(0)],
        ['phase', new Uniform(0)],
        ['warp', new Uniform(EDGE_WARP)],
        ['aberration', new Uniform(EDGE_ABERRATION)],
        ['ripple', new Uniform(new Vector3(0.5, 0.5, 0))],
        ['rippleStrength', new Uniform(0)],
        ['rippleWidth', new Uniform(RIPPLE_WIDTH)],
        ['rippleWarp', new Uniform(RIPPLE_WARP)],
      ]),
    })
  }

  /** Copies this frame's presence into the uniforms. `scale` tones the warp down (reduced motion). */
  sync(fx: PresenceFx, scale: number) {
    const u = this.uniforms
    u.get('amount')!.value = fx.level * scale
    ;(u.get('ripple')!.value as Vector3).set(fx.rippleX, fx.rippleY, fx.rippleRadius)
    u.get('rippleStrength')!.value = fx.rippleStrength * scale
  }

  override update(_renderer: WebGLRenderer, _inputBuffer: WebGLRenderTarget, deltaTime?: number) {
    if (this.still || !deltaTime) return
    const phase = this.uniforms.get('phase')!
    // Wrapped, so float precision holds up over a long visit (all the wave's terms repeat in 2π·10).
    phase.value = ((phase.value as number) + deltaTime * EDGE_WAVE_SPEED) % (Math.PI * 20)
  }
}

export const PresenceWarp = wrapEffect(PresenceWarpEffect)
