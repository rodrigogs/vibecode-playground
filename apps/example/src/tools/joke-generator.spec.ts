import { describe, expect, it } from 'vitest'

import { jokeGeneratorTool } from './joke-generator.js'

describe('Joke Generator Tool - Unit Tests', () => {
  it('should have correct tool configuration', () => {
    expect(jokeGeneratorTool.name).toBe('joke_generator')
    expect(jokeGeneratorTool.description).toBe(
      'Generate random programming jokes or dad jokes',
    )
    expect(jokeGeneratorTool.schema).toBeDefined()
  })

  it.each([
    ['programming jokes', 'programming', /^🎪 Programming Joke:/],
    ['dad jokes', 'dad', /^👨 Dad Joke:/],
    ['random jokes', 'random', /^(🎪 Programming Joke:|👨 Dad Joke:)/],
  ] as const)('should generate %s', async (_, type, expectedPattern) => {
    const result = await jokeGeneratorTool.func({ type })

    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    expect(result).toMatch(expectedPattern)
  })

  it('should include fun facts with jokes', async () => {
    const result = await jokeGeneratorTool.func({ type: 'programming' })

    expect(result).toContain('💡 Fun Fact:')
  })

  it.each([
    ['valid programming type', { type: 'programming' }, false],
    ['valid dad type', { type: 'dad' }, false],
    ['valid random type', { type: 'random' }, false],
    ['invalid type', { type: 'invalid' }, true],
    ['missing type', {}, true],
  ])('should validate schema for %s', (_, input, shouldThrow) => {
    const schema = jokeGeneratorTool.schema
    const testFn = () => schema.parse(input)

    if (shouldThrow) {
      expect(testFn).toThrow()
    } else {
      expect(testFn).not.toThrow()
    }
  })

  it('should handle case when no random joke is found', async () => {
    // This tests the fallback when randomJoke is undefined/null
    // By mocking Math.random to return a value that causes out of bounds access
    const originalMath = Math.random
    Math.random = () => 1 // This will cause out of bounds access (index >= array.length)

    const result = await jokeGeneratorTool.func({ type: 'random' })
    expect(result).toBe('No jokes available at the moment!')

    Math.random = originalMath
  })

  it('should handle case when no specific type joke is found', async () => {
    // This tests the fallback for specific types when Math.random causes out of bounds
    const originalMath = Math.random
    Math.random = () => 1 // This will cause out of bounds access (index >= array.length)

    const result = await jokeGeneratorTool.func({ type: 'programming' })
    expect(result).toBe('No jokes available for this type!')

    Math.random = originalMath
  })

  it('should handle case when no dad jokes are found', async () => {
    // Test the fallback for dad joke type when Math.random causes out of bounds
    const originalMath = Math.random
    Math.random = () => 1 // This will cause out of bounds access (index >= array.length)

    const result = await jokeGeneratorTool.func({ type: 'dad' })
    expect(result).toBe('No jokes available for this type!')

    Math.random = originalMath
  })

  it('should handle random fact fallback', async () => {
    // Test when randomFact is undefined and falls back to default message
    const originalMath = Math.random
    let callCount = 0
    Math.random = () => {
      callCount++
      if (callCount === 1) {
        return 0.5 // Valid joke selection
      }
      return 1 // Out of bounds for fun facts array
    }

    const result = await jokeGeneratorTool.func({ type: 'programming' })
    expect(result).toContain('💡 Fun Fact: Laughter is the best medicine!')

    Math.random = originalMath
  })

  it('should ensure random type selects programming jokes correctly', async () => {
    // Test that random type correctly identifies programming jokes
    const originalMath = Math.random
    Math.random = () => 0 // This will select the first programming joke

    const result = await jokeGeneratorTool.func({ type: 'random' })
    expect(result).toMatch(/^🎪 Programming Joke:/)
    expect(result).toContain(
      "Why don't programmers like nature? It has too many bugs.",
    )

    Math.random = originalMath
  })

  it('should ensure random type selects dad jokes correctly', async () => {
    // Test that random type correctly identifies dad jokes
    const originalMath = Math.random
    Math.random = () => 0.6 // This should select a dad joke (beyond programming jokes array)

    const result = await jokeGeneratorTool.func({ type: 'random' })
    expect(result).toMatch(/^👨 Dad Joke:/)

    Math.random = originalMath
  })

  it('should handle random fact fallback for random type', async () => {
    // Test when randomFact is undefined and falls back to default message for random type
    const originalMath = Math.random
    let callCount = 0
    Math.random = () => {
      callCount++
      if (callCount === 1) {
        return 0.5 // Valid joke selection
      }
      return 1 // Out of bounds for fun facts array
    }

    const result = await jokeGeneratorTool.func({ type: 'random' })
    expect(result).toContain('💡 Fun Fact: Laughter is the best medicine!')

    Math.random = originalMath
  })
})
