import { useGameStore } from '../../state/useGameStore'

/** Bottom right: 案内 GUIDE, opens the guide scroll (which gives focus back here on close). */
export default function GuideToggle() {
  const open = useGameStore((s) => s.guideOpen)
  const openGuide = useGameStore((s) => s.openGuide)

  return (
    <button
      type="button"
      className="hud__button hud__guide"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={openGuide}
    >
      <span className="kanji hud__guide-kanji" lang="ja">
        案内
      </span>
      <span className="label">Guide</span>
    </button>
  )
}
