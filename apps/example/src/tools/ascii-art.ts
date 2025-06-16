import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

export const asciiArtTool = new DynamicStructuredTool({
  name: 'ascii_art',
  description: 'Create ASCII art of various objects and animals',
  schema: z.object({
    subject: z
      .string()
      .describe('What to draw in ASCII art (e.g., cat, robot, heart, star)'),
  }),
  func: async ({ subject }) => {
    const artTemplates: Record<string, string> = {
      cat: `
   /\\_/\\
  ( o.o )
   > ^ <  `,
      robot: `
  ┌─────┐
  │ ◉ ◉ │
  │  ─  │
  └─┬─┬─┘
    │ │
  ┌─┴─┴─┐
  │[###]│
  └─────┘`,
      heart: `
  ♥♥   ♥♥
♥♥♥♥ ♥♥♥♥
♥♥♥♥♥♥♥♥♥
 ♥♥♥♥♥♥♥
  ♥♥♥♥♥
   ♥♥♥
    ♥`,
      star: `
    ★
   ★★★
  ★★★★★
 ★★★★★★★
★★★★★★★★★
 ★★★★★★★
  ★★★★★
   ★★★
    ★`,
      house: `
    /\\
   /  \\
  /____\\
  |    |
  | [] |
  |____|`,
      tree: `
    🌲
   🌲🌲🌲
  🌲🌲🌲🌲🌲
     |||
     |||`,
      smiley: `
  ☺☺☺☺☺☺☺
 ☺           ☺
☺  ●       ●  ☺
☺             ☺
☺   \\     /   ☺
☺    \\___/    ☺
 ☺           ☺
  ☺☺☺☺☺☺☺`,
      coffee: `
   (  )   (   )  )
    ) (   )  (  (
   ( )  (    ) )
   _____________
  <_____________> ___
  |             |/ _ \\
  |               | | |
  |               |_| |
 _|               |\\___/
|___________________|`,
    }

    const normalizedSubject = subject.toLowerCase()

    // Find matching art or create a simple fallback
    let art = artTemplates[normalizedSubject]
    let displaySubject = subject

    if (!art) {
      // Try partial matching
      const matchingKey = Object.keys(artTemplates).find(
        (key) =>
          key.includes(normalizedSubject) || normalizedSubject.includes(key),
      )

      if (matchingKey) {
        art = artTemplates[matchingKey]
        // For known subjects, capitalize for display
        displaySubject = subject.charAt(0).toUpperCase() + subject.slice(1)
      } else {
        // Create a simple fallback - keep original case for unknown subjects
        art = `
   ¯\\_(ツ)_/¯
  Sorry, no art
  for ${subject}!`
      }
    } else {
      // For known subjects, capitalize for display
      displaySubject = subject.charAt(0).toUpperCase() + subject.slice(1)
    }

    const funFacts = [
      'ASCII art was first used in computer programming in the 1960s!',
      "The word 'ASCII' stands for American Standard Code for Information Interchange.",
      'ASCII art was popular in early email signatures and bulletin board systems.',
      'Some ASCII artists can create incredibly detailed portraits using only text characters.',
      'ASCII art is still used today in terminal applications and text-based games!',
    ]

    const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)]

    return `ASCII Art: ${displaySubject}\n\n${art}\n\n🎨 ASCII Art Fun Fact: ${randomFact}`
  },
})
