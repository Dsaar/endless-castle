import { Fragment } from 'react'
import { KEY_COLUMNS, TOUCH_NOTE } from './content'

/** MOVING tab: two columns of key caps, each with a one-line description. */
export default function MovingPanel() {
  return (
    <>
      <div className="guide__keys">
        {KEY_COLUMNS.map((column, c) => (
          <ul key={c} className="guide__key-list">
            {column.map((binding) => (
              <li key={binding.keys.join()} className="guide__key-row">
                <span className="guide__caps">
                  {binding.keys.map((key, i) => (
                    <Fragment key={key}>
                      {binding.slashed && i > 0 && (
                        <span className="guide__slash" aria-hidden="true">
                          /
                        </span>
                      )}
                      <kbd className={key.length > 1 ? 'guide__kbd guide__kbd--word' : 'guide__kbd'}>{key}</kbd>
                    </Fragment>
                  ))}
                </span>
                <span className="guide__key-desc">{binding.description}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
      <p className="guide__note">{TOUCH_NOTE}</p>
    </>
  )
}
