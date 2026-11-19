import './Smoke.css'

const PUFFS = 6

/** Slow drifting smoke: blurred radial gradients animated with CSS transforms only. */
export default function Smoke() {
  return (
    <div className="smoke" aria-hidden="true">
      {Array.from({ length: PUFFS }, (_, i) => (
        <div key={i} className={`smoke__puff smoke__puff--${i + 1}`} />
      ))}
      <div className="smoke__vignette" />
    </div>
  )
}
