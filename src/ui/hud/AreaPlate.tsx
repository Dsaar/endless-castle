import { useWorldStore } from '../../state/useWorldStore'
import Crossfade from '../Crossfade'

/** Seconds for the crossfade when you walk into another room. */
const AREA_FADE = 0.8

/** Bottom left: the area you're in, its kanji, a hairline and the room number. */
export default function AreaPlate() {
  const area = useWorldStore((s) => s.area)
  const kanji = useWorldStore((s) => s.kanji)
  const room = useWorldStore((s) => s.room)

  return (
    <section className="hud__panel hud__area" aria-live="polite" aria-label="Where you are">
      {/* Area and room always change together, so the room alone keys the fade. */}
      <Crossfade contentKey={room} duration={AREA_FADE} className="hud__area-fade">
        <h2 className="hud__area-name">
          <span>{area}</span>
          <span className="kanji hud__area-kanji" lang="ja">
            {kanji}
          </span>
        </h2>
        <p className="hud__area-room">
          <span className="hud__area-line" aria-hidden="true" />
          <span className="label">N° {String(room).padStart(3, '0')}</span>
        </p>
      </Crossfade>
    </section>
  )
}
