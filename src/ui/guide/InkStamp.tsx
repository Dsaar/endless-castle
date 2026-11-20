import { useId } from 'react'

interface InkStampProps {
  /** The character pressed into the middle of the seal. */
  glyph: string
  /** Changes the roughness and the dry patches, so two stamps never match. */
  seed: number
  className?: string
}

/**
 * A faded, hand-pressed seal: a rough double ring with a kanji inside. Drawn in SVG; the edge
 * wobble and the patchy, dry ink come from turbulence filters. Uses `currentColor`.
 */
export default function InkStamp({ glyph, seed, className }: InkStampProps) {
  const filterId = `ink-stamp-${useId().replace(/:/g, '')}`
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs>
        <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
          {/* Wobble the edges. */}
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed={seed} result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="5" xChannelSelector="R" yChannelSelector="G" result="rough" />
          {/* Knock out dry patches where the seal didn't take. */}
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed={seed + 7} result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.6 0 0 0 2" result="holes" />
          <feComposite in="rough" in2="holes" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`} fill="none" stroke="currentColor">
        <circle cx="50" cy="50" r="44" strokeWidth="6" />
        <circle cx="50" cy="50" r="35" strokeWidth="1.6" />
        <text
          className="kanji"
          x="50"
          y="52"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="40"
          fill="currentColor"
          stroke="none"
        >
          {glyph}
        </text>
      </g>
    </svg>
  )
}
