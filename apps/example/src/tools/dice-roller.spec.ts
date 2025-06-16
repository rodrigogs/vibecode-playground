import { describe, expect, it, vi } from 'vitest'

import { diceRollerTool } from './dice-roller.js'

describe('Dice Roller Tool - Unit Tests', () => {
  it('should have correct tool configuration', () => {
    expect(diceRollerTool.name).toBe('dice_roller')
    expect(diceRollerTool.description).toBe(
      'Roll dice with specified number of sides and count',
    )
    expect(diceRollerTool.schema).toBeDefined()
  })

  it('should roll specified number of dice', async () => {
    const result = await diceRollerTool.func({ count: 3, sides: 6 })

    expect(result).toContain('🎲 Rolling 3 dice with 6 sides each')
    expect(result).toContain('Results:')
    expect(result).toContain('Total:')

    // Check that results are within valid range
    const totalMatch = result.match(/Total: (\d+)/)
    if (totalMatch) {
      const total = parseInt(totalMatch[1])
      expect(total).toBeGreaterThanOrEqual(3) // Minimum: 1 * 3
      expect(total).toBeLessThanOrEqual(18) // Maximum: 6 * 3
    }
  })

  it('should handle single die roll', async () => {
    const result = await diceRollerTool.func({ count: 1, sides: 20 })

    expect(result).toContain('🎲 Rolling 1 dice with 20 sides each')

    const totalMatch = result.match(/Total: (\d+)/)
    if (totalMatch) {
      const total = parseInt(totalMatch[1])
      expect(total).toBeGreaterThanOrEqual(1)
      expect(total).toBeLessThanOrEqual(20)
    }
  })

  it.each([
    [4, '4 sides'],
    [12, '12 sides'],
    [100, '100 sides'],
  ] as const)('should handle %s-sided dice', async (sides, expectedText) => {
    const result = await diceRollerTool.func({ count: 1, sides })
    expect(result).toContain(expectedText)
  })

  it('should provide dice fun facts', async () => {
    const result = await diceRollerTool.func({ count: 2, sides: 6 })
    expect(result).toContain('🎲 Dice Fun Fact:')
  })

  it.each([
    [{ count: 3, sides: 6 }, true],
    [{ count: 1, sides: 20 }, true],
    [{ count: 3 }, true],
    [{ sides: 6 }, false],
    [{}, false],
    [{ count: 'three', sides: 6 }, false],
    [{ count: 3, sides: 'six' }, false],
  ] as const)('should validate schema correctly', (input, shouldPass) => {
    const schema = diceRollerTool.schema

    if (shouldPass) {
      expect(() => schema.parse(input)).not.toThrow()
    } else {
      expect(() => schema.parse(input)).toThrow()
    }
  })

  it('should generate deterministic results with mocked Math.random', async () => {
    const originalRandom = Math.random
    Math.random = vi.fn(() => 0.5)

    const result1 = await diceRollerTool.func({ count: 1, sides: 6 })
    const result2 = await diceRollerTool.func({ count: 1, sides: 6 })

    // Both should give same result with same mock
    expect(result1).toEqual(result2)

    Math.random = originalRandom
  })
})
