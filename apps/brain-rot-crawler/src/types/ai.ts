import { z } from 'zod'

import type { CharacterInfo } from './character.js'

// Enhanced character schema with detailed descriptions
export const enhancementSchema = z.object({
  gender: z
    .enum(['male', 'female'])
    .describe('Character gender determined from context and name'),
  description: z
    .string()
    .max(1000)
    .describe(
      'Brief but vivid description of the character written in their original language, capturing their personality and brainrot style',
    ),
  background: z
    .string()
    .max(8000)
    .describe(
      'Character background written ENTIRELY in FIRST PERSON as the character speaking directly about their own experiences (3000-5000 characters), including authentic personality, profanity when appropriate, and immersive storytelling in their native language.',
    ),
  motifs: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe('Character motifs and themes'),
  catchphrases: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe('Character catchphrases'),
  bgm: z
    .string()
    .describe(
      "Background music suggestion that fits the character's personality and theme",
    ),
  voice: z.enum([
    'alloy',
    'ash',
    'ballad',
    'coral',
    'echo',
    'fable',
    'nova',
    'onyx',
    'sage',
    'shimmer',
    'verse',
  ])
    .describe(`Selected OpenAI TTS voice that best fits the character's gender, age, personality, and speaking style:

FEMALE VOICES:
- alloy: Female, contralto, smokey/husky voice. Low responsiveness (1/5). Good for: mature women, sultry characters, mysterious personalities. Accent compatibility: poor.
- coral: Female, soprano_2, clear/bright/versatile. High responsiveness (4/5). Good for: young women, international characters, versatile roles. Accent compatibility: excellent.
- fable: Female, alto, storytelling/narrative/dramatic. Medium responsiveness (3/5). Good for: storytellers, narrators, dramatic characters, wise women. Has slight English accent. Accent compatibility: good.
- nova: Female, alto, responsive/versatile/adaptable/clear. Very high responsiveness (5/5). Good for: modern women, adaptable characters, expressive roles. Accent compatibility: excellent.
- sage: Female, soprano_2, wise/thoughtful/sophisticated. Very high responsiveness (5/5). Good for: wise women, advisors, sophisticated characters. Accent compatibility: excellent.
- shimmer: Female, contralto, soothing/gentle/calming. High responsiveness (4/5). Good for: gentle characters, calming personalities, ethereal roles. Accent compatibility: good.

MALE VOICES:
- ash: Male, baritone, scratchy/upbeat/energetic/casual. Low responsiveness (1/5). Good for: young men, casual characters, energetic personalities. Accent compatibility: poor.
- ballad: Male, tenor_2, clear/refined/sophisticated with British accent. Low-medium responsiveness (2/5). Good for: sophisticated characters, refined personalities, British characters. Accent compatibility: good.
- echo: Male, tenor_1, energetic/warm/dynamic. Medium responsiveness (3/5). Good for: heroes, energetic characters, warm personalities. Accent compatibility: good.
- onyx: Male, bass, deep/husky/rich with wide vocal range. High responsiveness (4/5). Good for: mature men, deep voices, authoritative characters. Accent compatibility: good.
- verse: Male, tenor_2, very responsive/adaptable/expressive/versatile. Very high responsiveness (5/5). Good for: expressive characters, versatile roles, emotional characters. Accent compatibility: excellent.`),
})

export type Enhancement = z.infer<typeof enhancementSchema>

// Reference character type for examples
export interface ReferenceCharacter {
  name: string
  description: string
}

// Enhanced result type with cache status
export interface EnhancementResult extends Enhancement {
  wasFromCache: boolean
}

// AI agent interface
export interface AIAgent {
  enhance(character: CharacterInfo): Promise<EnhancementResult>
}
