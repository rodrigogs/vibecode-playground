import { describe, expect, it, vi } from 'vitest'

import { coinFlipperTool } from './coin-flipper.js'

describe('Coin Flipper Tool - Unit Tests', () => {
  it('should have correct tool configuration', () => {
    expect(coinFlipperTool.name).toBe('coin_flipper')
    expect(coinFlipperTool.description).toBe(
      'Flip coins and get heads or tails results',
    )
    expect(coinFlipperTool.schema).toBeDefined()
  })

  it('should flip specified number of coins', async () => {
    const result = await coinFlipperTool.func({ count: 3 })

    expect(result).toContain('🪙 Flipping 3 coins')
    expect(result).toContain('Results:')
    expect(result).toContain('Summary:')

    // Should contain heads and/or tails
    expect(result).toMatch(/(Heads|Tails)/)
  })

  it('should flip single coin', async () => {
    const result = await coinFlipperTool.func({ count: 1 })

    expect(result).toContain('🪙 Flipping 1 coins')
    expect(result).toMatch(/(Heads|Tails)/)
  })

  it('should provide accurate summary counts', async () => {
    // Mock Math.random to control outcomes
    const originalRandom = Math.random
    const mockResults = [0.3, 0.7, 0.2] // Heads, Tails, Heads
    let callCount = 0
    Math.random = vi.fn(() => mockResults[callCount++ % mockResults.length])

    const result = await coinFlipperTool.func({ count: 3 })

    expect(result).toContain('Heads: 2')
    expect(result).toContain('Tails: 1')

    Math.random = originalRandom
  })

  it('should include coin fun facts', async () => {
    const result = await coinFlipperTool.func({ count: 2 })
    expect(result).toContain('🪙 Coin Fun Fact:')
  })

  it.each([
    [{ count: 3 }, true],
    [{ count: 1 }, true],
    [{ count: 10 }, true],
    [{}, true], // count has default
    [{ count: 'three' }, false],
    [{ count: -1 }, false],
    [{ count: 0 }, false],
  ] as const)('should validate schema correctly', (input, shouldPass) => {
    const schema = coinFlipperTool.schema

    if (shouldPass) {
      expect(() => schema.parse(input)).not.toThrow()
    } else {
      expect(() => schema.parse(input)).toThrow()
    }
  })

  it('should handle edge cases', async () => {
    const result = await coinFlipperTool.func({ count: 1 })

    // Single coin should have either 1 head or 1 tail, but not both
    const headsMatch = result.match(/Heads: (\d+)/)
    const tailsMatch = result.match(/Tails: (\d+)/)

    if (headsMatch && tailsMatch) {
      const heads = parseInt(headsMatch[1])
      const tails = parseInt(tailsMatch[1])
      expect(heads + tails).toBe(1)
      expect(heads === 1 || tails === 1).toBe(true)
      expect(heads === 0 || tails === 0).toBe(true)
    }
  })

  it('should provide realistic probability for large samples', async () => {
    const result = await coinFlipperTool.func({ count: 100 })

    const headsMatch = result.match(/Heads: (\d+)/)
    const tailsMatch = result.match(/Tails: (\d+)/)

    if (headsMatch && tailsMatch) {
      const heads = parseInt(headsMatch[1])
      const tails = parseInt(tailsMatch[1])

      expect(heads + tails).toBe(100)
      // With a fair coin, we expect roughly 40-60 for each side in 100 flips
      expect(heads).toBeGreaterThanOrEqual(20)
      expect(heads).toBeLessThanOrEqual(80)
      expect(tails).toBeGreaterThanOrEqual(20)
      expect(tails).toBeLessThanOrEqual(80)
    }
  })
})
