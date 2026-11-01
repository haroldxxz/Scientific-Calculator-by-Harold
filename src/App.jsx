import { useCallback, useEffect, useMemo, useState } from 'react'
import { evaluateExpression } from './math.js'
import './App.css'

const scientificKeys = [
  ['sin', 'cos', 'tan', 'ln', 'log'],
  ['√', 'x²', 'xʸ', 'π', 'e'],
  ['(', ')', '!', '%', 'Ans'],
]

const keypadKeys = [
  ['C', '⌫', '±', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
]

const functionNames = {
  sin: 'sin',
  cos: 'cos',
  tan: 'tan',
  ln: 'ln',
  log: 'log',
  '√': 'sqrt',
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', {
    maximumSignificantDigits: 12,
    useGrouping: true,
  }).format(value)
}

function App() {
  const [expression, setExpression] = useState('')
  const [angleMode, setAngleMode] = useState('DEG')
  const [theme, setTheme] = useState('dark')
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [lastAnswer, setLastAnswer] = useState('')
  const [solvedExpression, setSolvedExpression] = useState('')
  const [justSolved, setJustSolved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const preview = useMemo(() => {
    if (!expression) return ''
    try {
      return formatNumber(evaluateExpression(expression, angleMode))
    } catch {
      return ''
    }
  }, [expression, angleMode])

  const calculate = useCallback(() => {
    if (!expression) return
    try {
      const value = evaluateExpression(expression, angleMode)
      const result = String(value)
      setHistory((items) =>
        [{ expression, result: formatNumber(value) }, ...items].slice(0, 10),
      )
      setLastAnswer(result)
      setSolvedExpression(expression)
      setExpression(result)
      setJustSolved(true)
      setError('')
    } catch (calculationError) {
      setError(calculationError.message)
      setJustSolved(false)
    }
  }, [angleMode, expression])

  const pressKey = useCallback(
    (key) => {
      if (key === '=') {
        calculate()
        return
      }

      if (key === 'AC' || key === 'C') {
        setExpression('')
        setSolvedExpression('')
        setJustSolved(false)
        setError('')
        return
      }

      if (key === '⌫') {
        setExpression((value) => value.slice(0, -1))
        setSolvedExpression('')
        setJustSolved(false)
        setError('')
        return
      }

      if (key === '±') {
        setExpression((value) => {
          if (!value) return '-'
          if (justSolved) return `-(${value})`
          if (value.startsWith('-(') && value.endsWith(')')) {
            return value.slice(2, -1)
          }
          return `-(${value})`
        })
        setSolvedExpression('')
        setJustSolved(false)
        setError('')
        return
      }

      if (key === 'Ans' && !lastAnswer) return

      const functionName = functionNames[key]
      if (functionName) {
        setExpression((value) =>
          justSolved && value
            ? `${functionName}(${value})`
            : `${value}${functionName}(`,
        )
      } else if (key === 'x²') {
        setExpression((value) => `${value}^2`)
      } else if (key === 'xʸ') {
        setExpression((value) => `${value}^`)
      } else if (key === 'Ans') {
        setExpression((value) =>
          justSolved || !value
            ? lastAnswer
            : `${value}${/[+\-*/^(]$/.test(value) ? '' : '*'}${lastAnswer}`,
        )
      } else {
        const startsNewExpression =
          justSolved &&
          (/^[0-9.]$/.test(key) || ['π', 'e', '('].includes(key))
        setExpression((value) =>
          startsNewExpression ? key : `${value}${key}`,
        )
      }

      setSolvedExpression('')
      setJustSolved(false)
      setError('')
    },
    [calculate, justSolved, lastAnswer],
  )

  useEffect(() => {
    function handleKeyboard(event) {
      const { key } = event
      const keyboardMap = {
        Enter: '=',
        '=': '=',
        Backspace: '⌫',
        Escape: 'AC',
        '*': '×',
        '/': '÷',
        '-': '−',
      }
      const mappedKey = keyboardMap[key] ?? key
      if (key === 'Escape' && showHistory) {
        event.preventDefault()
        setShowHistory(false)
        return
      }
      if (/^[0-9.+()%!]$/.test(mappedKey) || ['=', '⌫', 'AC', '×', '÷', '−'].includes(mappedKey)) {
        event.preventDefault()
        pressKey(mappedKey)
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [pressKey, showHistory])

  function selectHistory(item) {
    setExpression(item.expression)
    setSolvedExpression('')
    setJustSolved(false)
    setError('')
    setShowHistory(false)
  }

  const displayedExpression = justSolved ? solvedExpression : expression
  const displayedResult = justSolved ? formatNumber(Number(expression)) : preview

  function renderKeypad() {
    return (
      <div className="keypad" aria-label="Number pad">
        {keypadKeys.flat().map((key) => (
          <button
            className={[
              'key',
              'number-key',
              ['÷', '×', '−', '+'].includes(key) ? 'operator-key' : '',
              key === 'C' ? 'clear-key' : '',
              key === '⌫' ? 'backspace-key' : '',
              key === '=' ? 'equals-key' : '',
              key === '0' ? 'zero-key' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            key={key}
            type="button"
            onClick={() => pressKey(key)}
            aria-label={key === '⌫' ? 'Backspace' : key === 'C' ? 'Clear' : key}
          >
            {key === '⌫' ? <span aria-hidden="true">⌫</span> : key}
          </button>
        ))}
      </div>
    )
  }

  return (
    <main className="app-shell">
      <section className="workspace" aria-label="Calculator">
        {showHistory && (
          <section
            className="history-popover"
            id="calculation-history"
            aria-label="Calculation history"
          >
            <div className="history-popover-heading">
              <h2>History</h2>
              <div className="history-popover-actions">
                {history.length > 0 && (
                  <button
                    className="history-text-button"
                    type="button"
                    onClick={() => setHistory([])}
                  >
                    Clear
                  </button>
                )}
                <button
                  className="history-close-button"
                  type="button"
                  onClick={() => setShowHistory(false)}
                  aria-label="Close history"
                >
                  ×
                </button>
              </div>
            </div>
            {history.length === 0 ? (
              <p className="history-empty">Your calculations will appear here.</p>
            ) : (
              <ol className="history-list">
                {history.map((item, index) => (
                  <li key={`${item.expression}-${index}`}>
                    <button
                      className="history-item"
                      type="button"
                      onClick={() => selectHistory(item)}
                    >
                      <span className="history-expression">{item.expression}</span>
                      <span className="history-result">{item.result}</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        <article className="calculator-panel">
          <header className="calculator-heading">
            <h1>Spade</h1>
            <div className="header-actions">
              <button
                className="header-button theme-button"
                type="button"
                onClick={() =>
                  setTheme((currentTheme) =>
                    currentTheme === 'light' ? 'dark' : 'light',
                  )
                }
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
              </button>
              <button
                className={`header-button history-button ${showHistory ? 'selected' : ''}`}
                type="button"
                onClick={() => setShowHistory((visible) => !visible)}
                aria-expanded={showHistory}
                aria-controls="calculation-history"
              >
                <span aria-hidden="true">↺</span>
                History{history.length > 0 ? ` (${history.length})` : ''}
              </button>
            </div>
          </header>

          <div className="display" aria-live="polite">
            <div className="expression-line">
              <span className="expression-text">
                {displayedExpression || <span className="placeholder">0</span>}
              </span>
              <button
                className="mode-indicator"
                type="button"
                onClick={() =>
                  setAngleMode((mode) => (mode === 'DEG' ? 'RAD' : 'DEG'))
                }
                aria-label={`Angle mode ${angleMode}. Switch to ${angleMode === 'DEG' ? 'radians' : 'degrees'}`}
                title="Switch angle mode"
              >
                {angleMode}
              </button>
            </div>
            <div className="result-line">
              {error ? (
                <span className="error-message">{error}</span>
              ) : (
                <span className="result-value">{displayedResult || '0'}</span>
              )}
            </div>
          </div>

          <div
            className="scientific-grid"
            aria-label="Scientific functions"
          >
            {scientificKeys.flat().map((key) => (
              <button
                className={`key scientific-key ${['π', 'e', '!', '%', 'Ans'].includes(key) ? 'constant-key' : ''}`}
                key={key}
                type="button"
                onClick={() => pressKey(key)}
                aria-label={
                  key === '√'
                    ? 'Square root'
                    : key === 'x²'
                      ? 'Square'
                      : key === 'xʸ'
                        ? 'Power'
                        : key
                }
              >
                {key}
              </button>
            ))}
          </div>

          {renderKeypad()}
        </article>
      </section>
    </main>
  )
}

export default App
