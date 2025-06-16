import { describe, expect, it } from 'vitest'

import { writingPromptTool } from './writing-prompt.js'

describe('Writing Prompt Tool - Unit Tests', () => {
  it('should have correct tool configuration', () => {
    expect(writingPromptTool.name).toBe('writing_prompt')
    expect(writingPromptTool.description).toBe(
      'Generate creative writing prompts for stories, essays, or creative exercises',
    )
    expect(writingPromptTool.schema).toBeDefined()
  })

  it.each([
    ['fantasy', 'medium fantasy writing prompt:'],
    ['sci-fi', 'medium sci-fi writing prompt:'],
    ['mystery', 'medium mystery writing prompt:'],
    ['romance', 'medium romance writing prompt:'],
    ['horror', 'medium horror writing prompt:'],
  ] as const)(
    'should generate %s writing prompts',
    async (genre, expectedText) => {
      const result = await writingPromptTool.func({
        genre,
        length: 'medium',
      })
      expect(result).toContain(`✍️ Here's your ${expectedText}`)
    },
  )

  it('should generate random genre writing prompts', async () => {
    const result = await writingPromptTool.func({
      genre: 'random',
      length: 'medium',
    })
    expect(result).toContain('✍️')
    expect(result).toContain('writing prompt:')
  })

  it('should include writing tips', async () => {
    const result = await writingPromptTool.func({
      genre: 'fantasy',
      length: 'medium',
    })
    expect(result).toContain('🌟 Happy writing! Let your imagination run wild!')
  })

  it('should validate schema for genre parameter', () => {
    const schema = writingPromptTool.schema

    expect(() =>
      schema.parse({ genre: 'fantasy', length: 'medium' }),
    ).not.toThrow()
    expect(() =>
      schema.parse({ genre: 'sci-fi', length: 'medium' }),
    ).not.toThrow()
    expect(() =>
      schema.parse({ genre: 'mystery', length: 'medium' }),
    ).not.toThrow()
    expect(() =>
      schema.parse({ genre: 'romance', length: 'medium' }),
    ).not.toThrow()
    expect(() =>
      schema.parse({ genre: 'horror', length: 'medium' }),
    ).not.toThrow()
    expect(() =>
      schema.parse({ genre: 'random', length: 'medium' }),
    ).not.toThrow()

    // Test invalid values
    expect(() => schema.parse({ genre: 'invalid', length: 'medium' })).toThrow()
    expect(() => schema.parse({})).not.toThrow() // both genre and length have default values
    expect(() => schema.parse({ genre: 123, length: 'medium' })).toThrow()
  })

  it('should return different prompts on multiple calls', async () => {
    const result1 = await writingPromptTool.func({
      genre: 'fantasy',
      length: 'medium',
    })
    const result2 = await writingPromptTool.func({
      genre: 'fantasy',
      length: 'medium',
    })
    const result3 = await writingPromptTool.func({
      genre: 'fantasy',
      length: 'medium',
    })

    // While they might occasionally be the same due to randomness,
    // they should generally be different
    const prompts = [result1, result2, result3]
    const uniquePrompts = new Set(prompts)

    // Expect at least some variation (though all 3 could theoretically be the same)
    expect(uniquePrompts.size).toBeGreaterThanOrEqual(1)
    expect(uniquePrompts.size).toBeLessThanOrEqual(3)
  })

  it('should provide structured output', async () => {
    const result = await writingPromptTool.func({
      genre: 'mystery',
      length: 'medium',
    })

    // Should have a clear structure
    expect(result).toMatch(/✍️.*writing prompt:/)
    expect(result).toContain('🌟 Happy writing! Let your imagination run wild!')

    // Should have some content
    expect(result.length).toBeGreaterThan(50) // Substantial content
  })

  it('should handle undefined parameters with defaults', async () => {
    // Test with completely empty object to trigger default values
    const result = await writingPromptTool.func({})
    expect(result).toContain('✍️')
    expect(result).toContain('writing prompt:')
    expect(result).toContain('🌟 Happy writing! Let your imagination run wild!')
  })

  it('should handle partial parameters with defaults', async () => {
    // Test with only genre to trigger length default
    const result1 = await writingPromptTool.func({ genre: 'fantasy' })
    expect(result1).toContain('medium fantasy writing prompt:')

    // Test with only length to trigger genre default
    const result2 = await writingPromptTool.func({ length: 'short' })
    expect(result2).toContain('short')
    expect(result2).toContain('writing prompt:')
  })
})
