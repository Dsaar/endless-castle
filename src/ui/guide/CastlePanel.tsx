import { AREAS, LORE, NO_EXIT } from './content'

/** THE CASTLE tab: lore with a drop cap, the areas inside, and the last word. */
export default function CastlePanel() {
  return (
    <>
      <p className="guide__lore">{LORE}</p>
      <p className="guide__inside">
        <span className="label guide__eyebrow">What lies inside</span>
        {AREAS.join(' · ')}
      </p>
      <p className="guide__no-exit">{NO_EXIT}</p>
    </>
  )
}
