import { useFigureStore } from '../../state/useFigureStore'
import { FOUND_GLYPH, HIDDEN_INTRO } from './content'

/** HIDDEN ONES tab: six numbered slots. Unfound ones show "?". */
export default function HiddenOnesPanel() {
  const found = useFigureStore((s) => s.found)
  const count = found.filter(Boolean).length

  return (
    <>
      <p className="guide__intro">{HIDDEN_INTRO}</p>
      <ol className="guide__slots">
        {found.map((isFound, i) => (
          <li key={i} className={isFound ? 'guide__slot guide__slot--found' : 'guide__slot'}>
            <span className="guide__slot-mark" aria-hidden="true">
              {isFound ? <span className="kanji">{FOUND_GLYPH}</span> : '?'}
            </span>
            <span className="label guide__slot-number">
              No. {i + 1}
              <span className="guide__visually-hidden">{isFound ? ', found' : ', not yet found'}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="label guide__count">
        {count} of {found.length} found
      </p>
    </>
  )
}
