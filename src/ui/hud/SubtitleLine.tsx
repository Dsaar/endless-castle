import { useSubtitleStore } from '../../state/useSubtitleStore'
import Crossfade from '../Crossfade'

/** Seconds to fade a line in or out (or one into the next). */
const SUBTITLE_FADE = 0.6

/** Lower center: the line from `showSubtitle(en, ja, duration)`, English over a dimmer Japanese. */
export default function SubtitleLine() {
  const current = useSubtitleStore((s) => s.current)

  return (
    <div className="hud__subtitle" role="status">
      <Crossfade contentKey={current?.id ?? 0} duration={SUBTITLE_FADE} className="hud__subtitle-fade">
        {current && (
          <>
            <p className="hud__subtitle-en">{current.en}</p>
            {current.ja && (
              <p className="kanji hud__subtitle-ja" lang="ja">
                {current.ja}
              </p>
            )}
          </>
        )}
      </Crossfade>
    </div>
  )
}
