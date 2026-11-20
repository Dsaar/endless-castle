import { OMENS, SIGNS_INTRO } from './content'

/** SIGNS tab: the four omens and what they mean. */
export default function SignsPanel() {
  return (
    <>
      <p className="guide__intro">{SIGNS_INTRO}</p>
      <ul className="guide__omens">
        {OMENS.map((omen) => (
          <li key={omen.name} className="guide__omen">
            <span className="kanji guide__omen-glyph" aria-hidden="true">
              {omen.glyph}
            </span>
            <div>
              <h3 className="label guide__omen-name">{omen.name}</h3>
              <p className="guide__omen-meaning">{omen.meaning}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
