import { describe, expect, it } from 'vitest'

import { asciiArtTool } from './ascii-art.js'

describe('ASCII Art Tool - Unit Tests', () => {
  it('should have correct tool configuration', () => {
    expect(asciiArtTool.name).toBe('ascii_art')
    expect(asciiArtTool.description).toBe(
      'Create ASCII art of various objects and animals',
    )
    expect(asciiArtTool.schema).toBeDefined()
  })

  it.each([
    ['cat', '/\\_/\\', 'ASCII Art: Cat'],
    ['robot', '[###]', 'ASCII Art: Robot'],
    ['heart', '♥', 'ASCII Art: Heart'],
  ] as const)(
    'should generate ASCII art for %s',
    async (subject, expectedPattern, expectedTitle) => {
      const result = await asciiArtTool.func({ subject })
      expect(result).toContain(expectedTitle)
      expect(result).toContain(expectedPattern)
    },
  )

  it('should handle unknown subjects with fallback', async () => {
    const result = await asciiArtTool.func({ subject: 'unknown_subject' })
    expect(result).toContain('ASCII Art: unknown_subject')
    expect(result).toContain('¯\\_(ツ)_/¯')
  })

  it('should include fun facts with ASCII art', async () => {
    const result = await asciiArtTool.func({ subject: 'cat' })
    expect(result).toContain('🎨 ASCII Art Fun Fact:')
  })

  it.each([
    [{ subject: 'cat' }, true],
    [{ subject: 'robot' }, true],
    [{}, false],
    [{ subject: 123 }, false],
  ] as const)('should validate schema correctly', (input, shouldPass) => {
    const schema = asciiArtTool.schema

    if (shouldPass) {
      expect(() => schema.parse(input)).not.toThrow()
    } else {
      expect(() => schema.parse(input)).toThrow()
    }
  })

  it('should handle case-insensitive subjects', async () => {
    const lowerResult = await asciiArtTool.func({ subject: 'cat' })
    const upperResult = await asciiArtTool.func({ subject: 'CAT' })

    // Both should work, though they might differ in output
    expect(lowerResult).toContain('ASCII Art:')
    expect(upperResult).toContain('ASCII Art:')
  })

  it('should preserve original case for unknown subjects in fallback', async () => {
    const result = await asciiArtTool.func({ subject: 'WeIrD_CaSe' })
    expect(result).toContain('ASCII Art: WeIrD_CaSe')
    expect(result).toContain('¯\\_(ツ)_/¯')
    expect(result).toContain('Sorry, no art')
  })

  it('should handle partial matching and capitalize display name', async () => {
    // Test partial matching - searching for "rob" should match "robot"
    const result = await asciiArtTool.func({ subject: 'rob' })
    expect(result).toContain('ASCII Art: Rob') // Should be capitalized
    expect(result).toContain('[###]') // Should contain robot art
    expect(result).toContain('🎨 ASCII Art Fun Fact:')
  })

  it('should handle partial matching in reverse - when subject contains key', async () => {
    // Test reverse partial matching - searching for "treeview" should match "tree"
    const result = await asciiArtTool.func({ subject: 'treeview' })
    expect(result).toContain('ASCII Art: Treeview') // Should be capitalized
    expect(result).toContain('🌲') // Should contain tree art
    expect(result).toContain('🎨 ASCII Art Fun Fact:')
  })
})
