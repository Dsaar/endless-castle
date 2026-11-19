import { palette } from '../lib/palette'

/*
 * A single vermilion brush-stroke circle, generated procedurally so it has
 * a heavy loaded start, a thinning body, a dry tapering tail and a gap.
 * Rough edges come from an SVG displacement filter; bristle gaps from a mask.
 * The `data-enso-reveal` mask path can be animated (stroke-dashoffset 1 → 0)
 * to paint the stroke in.
 */

const CX = 100
const CY = 100
const R = 68
const DEG = Math.PI / 180
const START = -105 * DEG
const SWEEP = 330 * DEG
const STEPS = 140

/** Centerline radius at progress p: a little wobble, and a slight outward spiral. */
function radiusAt(p: number) {
  const a = START + SWEEP * p
  return R + 2.2 * Math.sin(3 * a + 0.6) + 1.1 * Math.sin(5 * a + 2.1) + 3 * p
}

/** Brush width at progress p: quick attack, steady thinning, dry taper. */
function widthAt(p: number) {
  const attack = Math.sin((Math.min(p / 0.07, 1) * Math.PI) / 2)
  const body = 18 - 11 * p
  const tail = p > 0.78 ? Math.pow((1 - p) / 0.22, 0.6) : 1
  const wobble = 1 + 0.08 * Math.sin(p * 23)
  return Math.max(0.5, body * (0.6 + 0.4 * attack) * tail * wobble)
}

function point(p: number, offset: number) {
  const a = START + SWEEP * p
  const r = radiusAt(p) + offset
  return `${(CX + r * Math.cos(a)).toFixed(2)} ${(CY + r * Math.sin(a)).toFixed(2)}`
}

function buildStroke() {
  const outer: string[] = []
  const inner: string[] = []
  for (let i = 0; i <= STEPS; i++) {
    const p = i / STEPS
    const half = widthAt(p) / 2
    outer.push(point(p, half))
    inner.push(point(p, -half))
  }
  inner.reverse()
  const capR = (widthAt(0) / 2).toFixed(2)
  // Outer edge forward, inner edge back, then a round cap bulging behind the start.
  return `M ${outer.join(' L ')} L ${inner.join(' L ')} A ${capR} ${capR} 0 0 1 ${outer[0]} Z`
}

function buildCenterline(from: number, to: number, offset = 0) {
  const pts: string[] = []
  const n = Math.ceil(STEPS * (to - from))
  for (let i = 0; i <= n; i++) pts.push(point(from + ((to - from) * i) / n, offset))
  return `M ${pts.join(' L ')}`
}

const STROKE = buildStroke()
const REVEAL = buildCenterline(-0.05, 1)
const BRISTLES = [
  { d: buildCenterline(0.42, 1, -3.2), w: 0.7, dash: '18 5 30 4 9 7' },
  { d: buildCenterline(0.55, 1, 1.4), w: 0.9, dash: '26 3 12 8 40 5' },
  { d: buildCenterline(0.66, 1, 3.4), w: 0.6, dash: '9 4 22 6' },
  { d: buildCenterline(0.3, 0.75, -0.6), w: 0.45, dash: '40 10 14 12' },
]

export default function InkEmblem({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <defs>
        <filter id="enso-ink" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="7" result="grain" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="grain"
            scale="3.5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <mask id="enso-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
          <path
            data-enso-reveal
            d={REVEAL}
            fill="none"
            stroke="white"
            strokeWidth="36"
            pathLength={1}
            strokeDasharray="1 1"
            style={{ strokeDashoffset: 1 }}
          />
          {BRISTLES.map((b, i) => (
            <path
              key={i}
              d={b.d}
              fill="none"
              stroke="black"
              strokeWidth={b.w}
              strokeDasharray={b.dash}
              strokeLinecap="round"
            />
          ))}
        </mask>
      </defs>
      <g mask="url(#enso-mask)">
        <path d={STROKE} fill={palette.vermilion} fillOpacity={0.94} filter="url(#enso-ink)" />
      </g>
    </svg>
  )
}
