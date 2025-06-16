import { describe, expect, it } from 'vitest'

import { calculatorTool } from './calculator.js'

describe('Calculator Tool - Unit Tests', () => {
  it('should have correct tool configuration', () => {
    expect(calculatorTool.name).toBe('calculator')
    expect(calculatorTool.description).toBe(
      'Perform mathematical calculations including basic arithmetic, powers, and square roots',
    )
    expect(calculatorTool.schema).toBeDefined()
  })

  it.each([
    ['addition', '2 + 3', '5'],
    ['subtraction', '10 - 4', '6'],
    ['multiplication', '3 * 4', '12'],
    ['division', '15 / 3', '5'],
  ])('should perform %s operation', async (_, expression, expected) => {
    const result = await calculatorTool.func({ expression })
    expect(result).toContain(`Result: ${expected}`)
  })

  it('should handle power operations', async () => {
    const result = await calculatorTool.func({ expression: '2^3' })
    expect(result).toContain('Result: 8')
  })

  it('should handle square root operations', async () => {
    const result = await calculatorTool.func({ expression: 'sqrt(16)' })
    expect(result).toContain('Result: 4')
  })

  it.each([
    ['mathematical constant pi', 'pi', '3.14159'],
    ['mathematical constant e', 'e', '2.71828'],
  ])('should handle %s', async (_, expression, expected) => {
    const result = await calculatorTool.func({ expression })
    expect(result).toContain(`Result: ${expected}`)
  })

  it.each([
    ['sin(0)', 'sin(0)', '0'],
    ['cos(0)', 'cos(0)', '1'],
  ])(
    'should handle trigonometric function %s',
    async (_, expression, expected) => {
      const result = await calculatorTool.func({ expression })
      expect(result).toContain(`Result: ${expected}`)
    },
  )

  it.each([
    ['alert injection', 'alert("hack")', 'Error: Invalid expression'],
    ['eval security risk', 'eval("1+1")', 'Error: Invalid expression'],
    [
      'function security risk',
      'function() { return 1; }',
      'Error: Invalid expression',
    ],
    ['string result', '"string"', 'Error: Invalid expression'],
    ['square root of negative', 'sqrt(-1)', 'Error: Invalid expression'],
  ])('should reject %s', async (_, expression, expectedError) => {
    const result = await calculatorTool.func({ expression })
    expect(result).toContain(expectedError)
  })

  it.each([
    ['division by zero', '1/0', 'Result: Infinity'],
    ['negative infinity result', '-1/0', 'Result: -Infinity'],
  ])('should handle %s', async (_, expression, expected) => {
    const result = await calculatorTool.func({ expression })
    expect(result).toContain(expected)
  })

  it.each([
    ['valid expression', { expression: '2 + 2' }, false],
    ['missing expression', {}, true],
    ['invalid type', { expression: 123 }, true],
  ])('should validate schema for %s', (_, input, shouldThrow) => {
    const schema = calculatorTool.schema
    const testFn = () => schema.parse(input)

    if (shouldThrow) {
      expect(testFn).toThrow()
    } else {
      expect(testFn).not.toThrow()
    }
  })

  it('should handle expressions that throw errors', async () => {
    const result = await calculatorTool.func({
      expression: 'undefined.property',
    })
    expect(result).toContain('❌ Error')
  })

  it('should handle all mathematical functions', async () => {
    const testCases = [
      ['tan(0)', '0'],
      ['log(1)', '0'],
      ['abs(-5)', '5'],
    ]

    for (const [expression, expected] of testCases) {
      const result = await calculatorTool.func({ expression })
      expect(result).toContain(`Result: ${expected}`)
    }
  })

  it('should handle expressions with invalid characters', async () => {
    const result = await calculatorTool.func({ expression: '2 + $ * 3' })
    expect(result).toContain('❌ Error: Invalid expression')
  })

  it('should handle non-Error instances in catch block', async () => {
    // This tests the else clause in the catch block for non-Error instances
    // We need an expression that passes regex validation but throws during evaluation
    const result = await calculatorTool.func({ expression: 'Math.sqrt()' })
    expect(result).toContain('❌ Error calculating')
  })

  it('should handle expressions that evaluate to non-numbers', async () => {
    // This should trigger the typeof result !== 'number' check
    const result = await calculatorTool.func({ expression: '{}' })
    expect(result).toContain('❌ Error: Invalid expression')
  })

  it('should identify whole numbers vs decimals correctly', async () => {
    // Test whole number
    const wholeResult = await calculatorTool.func({ expression: '4' })
    expect(wholeResult).toContain("🎯 That's a whole number!")

    // Test decimal number
    const decimalResult = await calculatorTool.func({ expression: '3.14' })
    expect(decimalResult).toContain("📊 That's a decimal number!")
  })

  it('should handle complex expressions', async () => {
    const result = await calculatorTool.func({ expression: '(2 + 3) * 4' })
    expect(result).toContain('Result: 20')
    expect(result).toContain("🎯 That's a whole number!")
  })

  it('should detect and block security threats in expressions', async () => {
    // Test expressions that pass regex but contain security issues
    const securityTests = [
      'Math.alert()', // Contains alert
      'Math.eval()', // Contains eval
      'Math.function()', // Contains function
    ]

    for (const expression of securityTests) {
      const result = await calculatorTool.func({ expression })
      expect(result).toContain('❌ Error: Invalid expression')
    }
  })

  it('should handle expressions that return non-number types', async () => {
    // This expression should cause a syntax error and be handled by catch block
    const result = await calculatorTool.func({ expression: '()' })
    expect(result).toContain('❌ Error calculating')
  })

  it('should handle expressions that evaluate to object types', async () => {
    // The 'Math' expression by itself should return the Math object, not a number
    const result = await calculatorTool.func({ expression: 'Math' })
    expect(result).toContain('❌ Error: Invalid expression')
  })

  it('should handle non-Error exceptions in catch block', async () => {
    // Mock Function constructor to throw a non-Error object
    const originalFunction = global.Function
    global.Function = (() => {
      throw 'String error' // Throwing a string instead of Error instance
    }) as any

    try {
      const result = await calculatorTool.func({ expression: '2 + 2' })
      expect(result).toContain(
        '❌ Error calculating "2 + 2": Invalid expression',
      )
    } finally {
      // Restore original Function
      global.Function = originalFunction
    }
  })
})
