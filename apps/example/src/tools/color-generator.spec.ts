import { describe, expect, it, vi } from 'vitest'

import { colorGeneratorTool } from './color-generator.js'

describe('Color Generator Tool - Unit Tests', () => {
  it('should have correct tool configuration', () => {
    expect(colorGeneratorTool.name).toBe('color_generator')
    expect(colorGeneratorTool.description).toBe(
      'Generate random colors and interesting facts',
    )
    expect(colorGeneratorTool.schema).toBeDefined()
  })

  it.each([
    ['hex', 'Hex:', /#[0-9a-fA-F]{6}/],
    ['rgb', 'RGB:', /rgb\(\d+, \d+, \d+\)/],
    ['hsl', 'HSL:', /hsl\(\d+, \d+%, \d+%\)/],
  ] as const)(
    'should generate colors in %s format',
    async (format, expectedLabel, expectedPattern) => {
      const result = await colorGeneratorTool.func({
        format,
        includeFact: true,
      })

      expect(result).toContain('🌈 Random Color Generator')
      expect(result).toContain(expectedLabel)
      expect(result).toMatch(expectedPattern)
    },
  )

  it('should generate random format when specified', async () => {
    const result = await colorGeneratorTool.func({
      format: 'random',
      includeFact: true,
    })

    expect(result).toContain('🌈 Random Color Generator')
    // Should contain one of the formats
    expect(result).toMatch(/(Hex:|RGB:|HSL:)/)
  })

  it('should include fun facts by default', async () => {
    const result = await colorGeneratorTool.func({
      format: 'hex',
      includeFact: true,
    })

    expect(result).toContain('🌈 Random Color Generator')
    expect(result).toContain('Fun Fact:')
  })

  it('should exclude fun facts when includeFact is false', async () => {
    const result = await colorGeneratorTool.func({
      format: 'hex',
      includeFact: false,
    })

    expect(result).toContain('🌈 Random Color Generator')
    expect(result).not.toContain('Fun Fact:')
  })

  it('should generate different colors on multiple calls', async () => {
    // Mock Math.random to return predictable values
    const mockMath = vi.spyOn(Math, 'random')

    // First call
    mockMath
      .mockReturnValueOnce(0.5) // r = 128
      .mockReturnValueOnce(0.3) // g = 76
      .mockReturnValueOnce(0.8) // b = 204

    const result1 = await colorGeneratorTool.func({
      format: 'hex',
      includeFact: true,
    })

    // Second call
    mockMath
      .mockReturnValueOnce(0.1) // r = 25
      .mockReturnValueOnce(0.9) // g = 230
      .mockReturnValueOnce(0.2) // b = 51

    const result2 = await colorGeneratorTool.func({
      format: 'hex',
      includeFact: true,
    })

    expect(result1).not.toBe(result2)

    mockMath.mockRestore()
  })

  it.each([
    ['hex', true],
    ['rgb', true],
    ['hsl', true],
    ['random', true],
  ] as const)(
    'should validate schema parameter format: %s',
    (format, shouldNotThrow) => {
      const schema = colorGeneratorTool.schema

      if (shouldNotThrow) {
        expect(() => schema.parse({ format })).not.toThrow()
      }
    },
  )

  it('should validate schema defaults', () => {
    const schema = colorGeneratorTool.schema
    const parsed = schema.parse({})
    expect(parsed.format).toBe('hex')
    expect(parsed.includeFact).toBe(true)
  })

  it.each([
    [
      'blue',
      [0.1, 0.2, 0.9], // r = 25, g = 51, b = 230 (max)
    ],
    [
      'green',
      [0.1, 0.9, 0.2], // r = 25, g = 230 (max), b = 51
    ],
  ] as const)(
    'should handle HSL edge case where %s is max',
    async (colorComponent, mockValues) => {
      const mockMath = vi.spyOn(Math, 'random')

      mockMath
        .mockReturnValueOnce(mockValues[0])
        .mockReturnValueOnce(mockValues[1])
        .mockReturnValueOnce(mockValues[2])

      const result = await colorGeneratorTool.func({
        format: 'hsl',
        includeFact: true,
      })
      expect(result).toContain('HSL:')

      mockMath.mockRestore()
    },
  )

  it('should handle HSL conversion when red is max (gNorm < bNorm)', async () => {
    // Test the case where red is max and gNorm < bNorm in HSL conversion
    const mockMath = vi.spyOn(Math, 'random')

    mockMath
      .mockReturnValueOnce(0.9) // r = 230 (max)
      .mockReturnValueOnce(0.1) // g = 25
      .mockReturnValueOnce(0.5) // b = 128 (gNorm < bNorm condition)

    const result = await colorGeneratorTool.func({
      format: 'hsl',
      includeFact: false,
    })

    expect(result).toContain('HSL:')
    expect(result).toContain('It leans toward red.')

    mockMath.mockRestore()
  })

  it('should handle HSL conversion when blue is max component', async () => {
    // Test the specific case for bNorm being max in HSL conversion
    const mockMath = vi.spyOn(Math, 'random')

    mockMath
      .mockReturnValueOnce(0.2) // r = 51
      .mockReturnValueOnce(0.3) // g = 76
      .mockReturnValueOnce(0.9) // b = 230 (max, should hit bNorm case)

    const result = await colorGeneratorTool.func({
      format: 'hsl',
      includeFact: false,
    })

    expect(result).toContain('HSL:')
    expect(result).toContain('It leans toward blue.')

    mockMath.mockRestore()
  })

  it('should handle grayscale colors (max === min)', async () => {
    // Test the case where max === min (grayscale), which skips the hue calculation
    const mockMath = vi.spyOn(Math, 'random')

    mockMath
      .mockReturnValueOnce(0.5) // r = 128
      .mockReturnValueOnce(0.5) // g = 128
      .mockReturnValueOnce(0.5) // b = 128 (all equal, max === min)

    const result = await colorGeneratorTool.func({
      format: 'hsl',
      includeFact: false,
    })

    expect(result).toContain('HSL:')
    expect(result).toContain("It's a balanced mix of colors.")

    mockMath.mockRestore()
  })

  it('should correctly identify light vs dark colors', async () => {
    const mockMath = vi.spyOn(Math, 'random')

    // Test light color
    mockMath
      .mockReturnValueOnce(0.9) // r = 230
      .mockReturnValueOnce(0.9) // g = 230
      .mockReturnValueOnce(0.9) // b = 230 (bright color)

    const lightResult = await colorGeneratorTool.func({
      format: 'hex',
      includeFact: false,
    })

    expect(lightResult).toContain('This is a light color.')

    // Test dark color
    mockMath
      .mockReturnValueOnce(0.1) // r = 25
      .mockReturnValueOnce(0.1) // g = 25
      .mockReturnValueOnce(0.1) // b = 25 (dark color)

    const darkResult = await colorGeneratorTool.func({
      format: 'hex',
      includeFact: false,
    })

    expect(darkResult).toContain('This is a dark color.')

    mockMath.mockRestore()
  })

  it('should handle random format selection correctly', async () => {
    const mockMath = vi.spyOn(Math, 'random')

    // Test each format selection in random mode
    mockMath
      .mockReturnValueOnce(0.5) // r
      .mockReturnValueOnce(0.5) // g
      .mockReturnValueOnce(0.5) // b
      .mockReturnValueOnce(0) // select 'hex' format

    const hexResult = await colorGeneratorTool.func({
      format: 'random',
      includeFact: false,
    })
    expect(hexResult).toContain('Hex:')

    mockMath
      .mockReturnValueOnce(0.5) // r
      .mockReturnValueOnce(0.5) // g
      .mockReturnValueOnce(0.5) // b
      .mockReturnValueOnce(0.4) // select 'rgb' format

    const rgbResult = await colorGeneratorTool.func({
      format: 'random',
      includeFact: false,
    })
    expect(rgbResult).toContain('RGB:')

    mockMath
      .mockReturnValueOnce(0.5) // r
      .mockReturnValueOnce(0.5) // g
      .mockReturnValueOnce(0.5) // b
      .mockReturnValueOnce(0.8) // select 'hsl' format

    const hslResult = await colorGeneratorTool.func({
      format: 'random',
      includeFact: false,
    })
    expect(hslResult).toContain('HSL:')

    mockMath.mockRestore()
  })

  it('should handle fun facts selection', async () => {
    const mockMath = vi.spyOn(Math, 'random')

    // Mock to select a specific fun fact
    mockMath
      .mockReturnValueOnce(0.5) // r
      .mockReturnValueOnce(0.5) // g
      .mockReturnValueOnce(0.5) // b
      .mockReturnValueOnce(0) // select first fun fact

    const result = await colorGeneratorTool.func({
      format: 'hex',
      includeFact: true,
    })

    expect(result).toContain('Fun Fact:')
    expect(result).toContain(
      'The human eye can distinguish about 10 million different colors!',
    )

    mockMath.mockRestore()
  })

  it('should handle HSL conversion edge case where gNorm < bNorm', async () => {
    const mockMath = vi.spyOn(Math, 'random')

    // Mock specific values to trigger the gNorm < bNorm branch in HSL conversion
    // This will create a case where red is max, but green < blue
    mockMath
      .mockReturnValueOnce(0.8) // r = 204 (max)
      .mockReturnValueOnce(0.2) // g = 51 (min)
      .mockReturnValueOnce(0.6) // b = 153 (middle)

    const result = await colorGeneratorTool.func({
      format: 'hsl',
      includeFact: false,
    })

    expect(result).toContain('HSL:')
    expect(result).toContain('hsl(')

    mockMath.mockRestore()
  })

  it('should cover the exact gNorm < bNorm branch when red is max', async () => {
    // Mock Math.random to create a scenario where:
    // - red is max (highest value)
    // - green < blue (to trigger gNorm < bNorm condition)
    // This will specifically hit line 52: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)
    const mockMath = vi.spyOn(Math, 'random')

    // Create exact values that guarantee red is max and green < blue
    mockMath
      .mockReturnValueOnce(0.9) // r = 229.5 (max)
      .mockReturnValueOnce(0.1) // g = 25.5 (min)
      .mockReturnValueOnce(0.7) // b = 178.5 (middle)

    const result = await colorGeneratorTool.func({
      format: 'hsl',
      includeFact: false,
    })

    // Verify that we got a valid HSL result
    expect(result).toContain('HSL:')
    expect(result).toContain('hsl(')

    // With these values:
    // rNorm = 0.9, gNorm = 0.1, bNorm = 0.7
    // max = rNorm (0.9), so we go to case rNorm
    // gNorm (0.1) < bNorm (0.7), so the ternary should add 6
    expect(result).toMatch(/hsl\(\s*\d+/)

    mockMath.mockRestore()
  })

  it('should cover specific HSL edge case: red max with gNorm < bNorm condition', async () => {
    // Create a color where red is max and green < blue to hit line 52
    // RGB: (255, 100, 150) -> Red is max, green < blue
    const mockMath = vi.spyOn(Math, 'random')
    mockMath
      .mockReturnValueOnce(1.0) // Red = 255
      .mockReturnValueOnce(0.392) // Green = 100 (100/255 ≈ 0.392)
      .mockReturnValueOnce(0.588) // Blue = 150 (150/255 ≈ 0.588)

    const result = await colorGeneratorTool.func({
      format: 'hsl',
      includeFact: false,
    })

    // Verify HSL output structure
    expect(result).toContain('HSL:')

    mockMath.mockRestore()
  })

  it('should cover HSL branch where red is max and gNorm >= bNorm (adds 0)', async () => {
    // This test specifically targets the case where red is max
    // AND gNorm >= bNorm to hit the "0" branch of the ternary operator
    const mockMath = vi.spyOn(Math, 'random')

    mockMath
      .mockReturnValueOnce(0.9) // r = 230 (max)
      .mockReturnValueOnce(0.6) // g = 153 (greater than blue)
      .mockReturnValueOnce(0.3) // b = 77 (less than green)
    // This creates: rNorm=0.9, gNorm=0.6, bNorm=0.3
    // Since rNorm is max, we enter case rNorm
    // Since gNorm (0.6) >= bNorm (0.3), the ternary evaluates to 0

    const result = await colorGeneratorTool.func({
      format: 'hsl',
      includeFact: false,
    })

    expect(result).toContain('HSL:')
    expect(result).toContain('hsl(')

    mockMath.mockRestore()
  })
})
