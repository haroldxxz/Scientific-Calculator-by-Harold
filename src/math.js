const functions = new Set([
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'sqrt',
  'ln',
  'log',
  'abs',
  'floor',
  'ceil',
])

function tokenize(expression) {
  const tokens = []
  let position = 0

  while (position < expression.length) {
    const remaining = expression.slice(position)
    const character = expression[position]

    if (/\s/.test(character)) {
      position += 1
      continue
    }

    const number = remaining.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/)
    if (number) {
      tokens.push({ type: 'number', value: Number(number[0]) })
      position += number[0].length
      continue
    }

    const identifier = remaining.match(/^[a-zA-Z]+|^π/)
    if (identifier) {
      const value = identifier[0] === 'π' ? 'pi' : identifier[0].toLowerCase()
      tokens.push({ type: 'identifier', value })
      position += identifier[0].length
      continue
    }

    const operators = {
      '×': '*',
      '÷': '/',
      '−': '-',
      '√': 'sqrt',
    }
    const value = operators[character] ?? character
    if ('+-*/^!%()'.includes(value) || value === 'sqrt') {
      tokens.push(
        value === 'sqrt'
          ? { type: 'identifier', value }
          : { type: 'operator', value },
      )
      position += 1
      continue
    }

    throw new Error(`Unexpected character: ${character}`)
  }

  tokens.push({ type: 'end', value: '' })
  return tokens
}

function factorial(value) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('Factorial needs a non-negative whole number.')
  }
  if (value > 170) {
    throw new Error('The factorial result is too large.')
  }

  let result = 1
  for (let factor = 2; factor <= value; factor += 1) {
    result *= factor
  }
  return result
}

export function evaluateExpression(expression, angleMode = 'DEG') {
  const tokens = tokenize(expression)
  let position = 0
  const current = () => tokens[position]
  const consume = (value) => {
    if (current().value !== value) {
      throw new Error(`Expected "${value}".`)
    }
    position += 1
  }

  function parseExpression() {
    let value = parseTerm()
    while (current().value === '+' || current().value === '-') {
      const operator = current().value
      position += 1
      const right = parseTerm()
      value = operator === '+' ? value + right : value - right
    }
    return value
  }

  function startsPrimary(token) {
    return (
      token.type === 'number' ||
      token.type === 'identifier' ||
      token.value === '('
    )
  }

  function parseTerm() {
    let value = parseUnary()
    while (true) {
      if (current().value === '*' || current().value === '/') {
        const operator = current().value
        position += 1
        const right = parseUnary()
        if (operator === '/' && right === 0) {
          throw new Error('Cannot divide by zero.')
        }
        value = operator === '*' ? value * right : value / right
      } else if (startsPrimary(current())) {
        value *= parseUnary()
      } else {
        return value
      }
    }
  }

  function parseUnary() {
    if (current().value === '+') {
      position += 1
      return parseUnary()
    }
    if (current().value === '-') {
      position += 1
      return -parseUnary()
    }
    return parsePower()
  }

  function parsePower() {
    const value = parsePostfix()
    if (current().value === '^') {
      position += 1
      return value ** parseUnary()
    }
    return value
  }

  function parsePostfix() {
    let value = parsePrimary()
    while (current().value === '!' || current().value === '%') {
      if (current().value === '!') {
        value = factorial(value)
      } else {
        value /= 100
      }
      position += 1
    }
    return value
  }

  function parsePrimary() {
    const token = current()

    if (token.type === 'number') {
      position += 1
      return token.value
    }

    if (token.value === '(') {
      position += 1
      const value = parseExpression()
      consume(')')
      return value
    }

    if (token.type === 'identifier') {
      position += 1
      if (token.value === 'pi') return Math.PI
      if (token.value === 'e') return Math.E
      if (!functions.has(token.value)) {
        throw new Error(`Unknown function or constant: ${token.value}`)
      }
      consume('(')
      const argument = parseExpression()
      consume(')')

      const toRadians = (value) =>
        angleMode === 'DEG' ? (value * Math.PI) / 180 : value
      const fromRadians = (value) =>
        angleMode === 'DEG' ? (value * 180) / Math.PI : value
      const functionMap = {
        sin: (value) => Math.sin(toRadians(value)),
        cos: (value) => Math.cos(toRadians(value)),
        tan: (value) => {
          const radians = toRadians(value)
          if (Math.abs(Math.cos(radians)) < 1e-12) {
            throw new Error('Tangent is undefined at this angle.')
          }
          return Math.tan(radians)
        },
        asin: (value) => fromRadians(Math.asin(value)),
        acos: (value) => fromRadians(Math.acos(value)),
        atan: (value) => fromRadians(Math.atan(value)),
        sqrt: (value) => Math.sqrt(value),
        ln: (value) => Math.log(value),
        log: (value) => Math.log10(value),
        abs: (value) => Math.abs(value),
        floor: (value) => Math.floor(value),
        ceil: (value) => Math.ceil(value),
      }
      return functionMap[token.value](argument)
    }

    throw new Error('Enter a number or a complete expression.')
  }

  const result = parseExpression()
  if (current().type !== 'end') {
    throw new Error(`Unexpected token: ${current().value}`)
  }
  if (!Number.isFinite(result)) {
    throw new Error('The result is outside the calculator range.')
  }
  return Object.is(result, -0) ? 0 : result
}
