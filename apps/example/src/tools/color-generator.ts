import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

export const colorGeneratorTool = new DynamicStructuredTool({
  name: 'color_generator',
  description: 'Generate random colors and interesting facts',
  schema: z.object({
    format: z
      .enum(['hex', 'rgb', 'hsl', 'random'])
      .default('hex')
      .describe('Color format to generate'),
    includeFact: z
      .boolean()
      .default(true)
      .describe('Whether to include a random fun fact'),
  }),
  func: async ({ format, includeFact = true }) => {
    // Generate random color
    const r = Math.floor(Math.random() * 256)
    const g = Math.floor(Math.random() * 256)
    const b = Math.floor(Math.random() * 256)

    let colorString = ''
    const actualFormat =
      format === 'random'
        ? ['hex', 'rgb', 'hsl'][Math.floor(Math.random() * 3)]
        : format

    switch (actualFormat) {
      case 'hex':
        colorString = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
        break
      case 'rgb':
        colorString = `rgb(${r}, ${g}, ${b})`
        break
      case 'hsl': {
        // Convert RGB to HSL
        const rNorm = r / 255
        const gNorm = g / 255
        const bNorm = b / 255
        const max = Math.max(rNorm, gNorm, bNorm)
        const min = Math.min(rNorm, gNorm, bNorm)
        let h = 0
        let s = 0
        const l = (max + min) / 2

        if (max !== min) {
          const d = max - min
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
          switch (max) {
            case rNorm:
              h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)
              break
            case gNorm:
              h = (bNorm - rNorm) / d + 2
              break
            case bNorm:
              h = (rNorm - gNorm) / d + 4
              break
          }
          h /= 6
        }

        colorString = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
        break
      }
    }

    let result = '🌈 Random Color Generator\n\n'

    // Add format-specific label and color
    switch (actualFormat) {
      case 'hex':
        result += `Hex: ${colorString}\n`
        break
      case 'rgb':
        result += `RGB: ${colorString}\n`
        break
      case 'hsl':
        result += `HSL: ${colorString}\n`
        break
    }

    // Add color description
    const brightness = r * 0.299 + g * 0.587 + b * 0.114
    const isLight = brightness > 127
    result += `\nThis is a ${isLight ? 'light' : 'dark'} color. `

    // Dominant color
    const max = Math.max(r, g, b)
    if (r === max && r > g + 30 && r > b + 30) result += 'It leans toward red. '
    else if (g === max && g > r + 30 && g > b + 30)
      result += 'It leans toward green. '
    else if (b === max && b > r + 30 && b > g + 30)
      result += 'It leans toward blue. '
    else result += "It's a balanced mix of colors. "

    if (includeFact) {
      const facts = [
        'The human eye can distinguish about 10 million different colors!',
        'The color blue was the last color to be named in most languages.',
        "Pink doesn't exist in the light spectrum - it's created by our brains!",
        'Ancient Egyptians and Chinese used colors for healing and therapy.',
        "Bees can see ultraviolet colors that humans can't perceive.",
        "The color red can actually make time feel like it's passing slower.",
        'Mantis shrimp can see 16 types of color receptors (humans have only 3).',
        'The color orange was named after the fruit, not the other way around!',
        'Looking at the color green can improve your creativity and reduce eye strain.',
        "There's a color called 'impossible colors' that can't normally be seen.",
      ]

      const randomFact = facts[Math.floor(Math.random() * facts.length)]
      result += `\n\nFun Fact: ${randomFact}`
    }

    return result
  },
})
