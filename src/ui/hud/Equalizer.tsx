const BARS = 5

/** Five little bars that dance while sound is on and lie flat while it is off (CSS only). */
export default function Equalizer({ playing }: { playing: boolean }) {
  return (
    <span className={playing ? 'hud__eq hud__eq--playing' : 'hud__eq'} aria-hidden="true">
      {Array.from({ length: BARS }, (_, i) => (
        <span key={i} className="hud__eq-bar" />
      ))}
    </span>
  )
}
