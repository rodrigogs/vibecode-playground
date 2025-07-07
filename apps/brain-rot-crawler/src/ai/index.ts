import fs from 'node:fs/promises'
import path from 'node:path'

import { createAgent, type Model, type Providers } from '@repo/ai'
import { Cache, FsCacheAdapter } from '@repo/cache'

import type {
  CharacterInfo,
  Enhancement,
  EnhancementResult,
  ReferenceCharacter,
} from '../types/index.js'
import { enhancementSchema } from '../types/index.js'

// Simple AI agent for character enhancement
export const buildAIAgent = async () => {
  const cacheDir = '.cache/ai'

  // Ensure cache directory exists
  try {
    await fs.mkdir(cacheDir, { recursive: true })
    console.log(`📁 Cache directory created/verified: ${cacheDir}`)
  } catch (error) {
    console.warn(`⚠️ Could not create cache directory: ${error}`)
  }

  const cache = new Cache(new FsCacheAdapter(cacheDir))
  let referenceCharacters: ReferenceCharacter[] = []

  const { provider, model } = getAIConfig()
  const agent = createAgent({
    provider,
    model,
    name: 'character-enhancer',
  })

  // Load reference characters on initialization
  loadReferenceCharacters()
    .then((chars: ReferenceCharacter[]) => {
      referenceCharacters = chars
      console.log(
        `📚 Loaded ${referenceCharacters.length} reference characters`,
      )
    })
    .catch(() => {
      console.warn(
        '⚠️ Could not load reference characters, continuing without them',
      )
    })

  async function loadReferenceCharacters(): Promise<ReferenceCharacter[]> {
    try {
      const filePath = path.resolve('src/data/example-characters.json')
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const json = JSON.parse(fileContent) as {
        characters: ReferenceCharacter[]
      }
      return json.characters || []
    } catch {
      return []
    }
  }

  return {
    async enhance(character: CharacterInfo): Promise<EnhancementResult> {
      // Check cache first
      const cacheKey = generateCacheKey(character)
      console.log(`   🔑 Cache key: ${cacheKey}`)

      try {
        const cached = await cache.get<Enhancement>(cacheKey)
        if (cached) {
          console.log(`   ✨ Cache hit for ${character.name}`)
          return { ...cached, wasFromCache: true }
        }
      } catch (cacheError) {
        console.warn(
          `   ⚠️ Cache read error for ${character.name}: ${cacheError}`,
        )
      }

      // Generate with AI
      console.log(`   🤖 Generating for ${character.name}...`)

      // Extract original section and prepare reference examples
      const originalSection = extractOriginalSection(character.context || '')
      const referenceExamples = referenceCharacters
        .slice(0, 3)
        .map((c) => `- ${c.name}: ${c.description}`)
        .join('\\n')

      const prompt = buildEnhancementPrompt(
        character,
        originalSection,
        referenceExamples,
      )

      const result = await agent.invoke({
        messages: [{ role: 'user', content: prompt }],
      })

      const content = result.messages[result.messages.length - 1]
        ?.content as string

      // First try to extract JSON from markdown code block
      let jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/)
      if (!jsonMatch) {
        // Fallback to extracting any JSON object
        jsonMatch = content.match(/\{[\s\S]*\}/)
      }

      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response')
      }

      const jsonString = jsonMatch[1] || jsonMatch[0]
      const parsed = JSON.parse(jsonString)
      const validated = enhancementSchema.parse(parsed)

      // Cache for 1 hour
      try {
        await cache.set(cacheKey, validated, 3600000)
        console.log(`   💾 Cached result for ${character.name}`)
      } catch (cacheError) {
        console.warn(
          `   ⚠️ Cache write error for ${character.name}: ${cacheError}`,
        )
      }

      return { ...validated, wasFromCache: false }
    },
  }
}

function getAIConfig(): { provider: Providers; model: Model } {
  return {
    provider: 'openai',
    model: 'gpt-4o',
  }
}

function generateCacheKey(character: CharacterInfo): string {
  // Create a filesystem-safe cache key by encoding special characters
  const safeName = character.name.replace(/[^a-zA-Z0-9]/g, '_')
  const safeUrl = character.url.replace(/[^a-zA-Z0-9]/g, '_')
  return `enhancement_${safeName}_${safeUrl}`
}

function extractOriginalSection(context: string): string {
  const lines = context.split('\\n')
  const originalIndex = lines.findIndex((line) =>
    line.toLowerCase().includes('original'),
  )

  if (originalIndex === -1) return context.slice(0, 500)

  return lines
    .slice(originalIndex, originalIndex + 10)
    .join('\\n')
    .slice(0, 500)
}

function buildEnhancementPrompt(
  character: CharacterInfo,
  originalSection: string,
  referenceExamples: string,
): string {
  const countryText = character.countries.join(', ')
  const otherText = character.other.join(', ')

  return `
You are an expert brainrot character writer specializing in creating AUTHENTIC, IMMERSIVE, and PERSONALITY-RICH character descriptions and backgrounds.

TASK: Enhance this character with a detailed description, background story, and select the most appropriate voice.

CRITICAL STYLE REQUIREMENTS:
1. Characters MUST have TONS of personality and speak authentically like brainrot characters
2. If the character's context suggests profane/offensive content, embrace it - don't tone it down
3. Background MUST be written in FIRST PERSON as the CHARACTER SPEAKING directly about their own experiences
4. Make backgrounds LONG, DETAILED, and ENGAGING - tell complete stories with adventures
5. Use authentic slang, profanity, and personality quirks appropriate to their origin
6. Capture the absurd, chaotic, and surreal nature of brainrot culture

CHARACTER DATA:
- Name: ${character.name}
- Countries: ${countryText}
- Popularity: ${character.popularity}
- Other tags: ${otherText}
- Source context: ${originalSection}

BRAINROT STYLE GUIDELINES:
1. **MANDATORY**: FIRST determine the character's gender based on their name, context, and cultural background (use "male" or "female" only)
2. Write BOTH description and background in the character's MAIN LANGUAGE (Italian for Italian characters, Indonesian for Indonesian characters, etc.)
3. Keep descriptions vivid but concise (under 1000 chars)
4. Write background ENTIRELY in FIRST PERSON as the CHARACTER SPEAKING directly about their own experiences and adventures
5. Make backgrounds DETAILED (3000-5000 characters) with complete stories told BY the character themselves
6. Include profanity, slang, and authentic language when appropriate - DON'T censor or tone down
7. Characters should speak in their authentic voice throughout the entire background
8. Include cultural references and expressions from their origin
9. Make it feel like the character is personally telling you their wild, absurd story
10. **MANDATORY BGM RULE**: Suggest appropriate background music that fits the character's personality and theme (see examples for reference)
11. **MANDATORY**: SELECT THE VOICE that matches the character's DETERMINED GENDER first, then personality and speaking style

REFERENCE EXAMPLES OF PERFECT BRAINROT STYLE:
${referenceExamples}

EXAMPLE OF PERFECT BRAINROT BACKGROUND STYLE:
"Trallallero, trallallà, porco Dio e porco Allah! Ero con il mio fottuto figlio Merdardo a giocare a Fortnite quando a un punto arriva mia nonna, Ornella Leccacappella a avvisarci che quello stronzo di Burger ci aveva invitato a cena per mangiare un purè di cazzi. E io gli ho risposto: "Ma col cazzo che ci vado, bastarda di una nonna puttana! Ogni volta che mi invita succede un fottuto bordello". Madonna bastarda! Non avessi mai rifiutato! Quello coglione di Burger era appostato zitto zitto dietro la finestra..."

EXAMPLE BGM SUGGESTIONS FROM REFERENCES:
- "Bad Style - Time Back" (for energetic, chaotic characters)
- "Spooky, Quiet, Scary Atmosphere" (for creepy, mysterious characters)
- "Kingdom of Predators" (for forest/nature characters)
- "The Sound Of Your Fear" (for intimidating characters)
- "Darkest Child" (for evil, disturbing characters)

VOICE SELECTION RULES:
1. FIRST determine if character is male or female
2. ONLY choose from voices that match the character's gender
3. THEN pick the specific voice that best fits their personality

FEMALE VOICES (use ONLY for female characters):
- alloy: Female, contralto, smokey/husky voice. Good for: mature women, sultry characters, mysterious personalities.
- coral: Female, soprano, clear/bright/versatile. Good for: young women, international characters, versatile roles.
- fable: Female, alto, storytelling/narrative/dramatic. Good for: storytellers, narrators, dramatic characters, wise women.
- nova: Female, alto, responsive/versatile/adaptable/clear. Good for: modern women, adaptable characters, expressive roles.
- sage: Female, soprano, wise/thoughtful/sophisticated. Good for: wise women, advisors, sophisticated characters.
- shimmer: Female, contralto, soothing/gentle/calming. Good for: gentle characters, calming personalities, ethereal roles.

MALE VOICES (use ONLY for male characters):
- ash: Male, baritone, scratchy/upbeat/energetic/casual. Good for: young men, casual characters, energetic personalities.
- ballad: Male, tenor, clear/refined/sophisticated with British accent. Good for: sophisticated characters, refined personalities, British characters.
- echo: Male, tenor, energetic/warm/dynamic. Good for: heroes, energetic characters, warm personalities.
- onyx: Male, bass, deep/husky/rich with wide vocal range. Good for: mature men, deep voices, authoritative characters.
- verse: Male, tenor, very responsive/adaptable/expressive/versatile. Good for: expressive characters, versatile roles, emotional characters.

CRITICAL INSTRUCTIONS:
- Write backgrounds ENTIRELY in FIRST PERSON as the character speaking directly
- Make backgrounds LONG and DETAILED (3000-5000 characters) with complete stories told BY the character
- Include authentic profanity and slang when appropriate - DON'T tone it down
- The character should tell their own story with lots of personality
- Capture the absurd, chaotic spirit of brainrot culture
- Use their native language and authentic expressions
- Make it feel like the character is personally telling you their wild story

Respond with a JSON object only:
{
  "gender": "male" or "female" (REQUIRED - must determine this first),
  "description": "Brief character description in their MAIN LANGUAGE",
  "background": "LONG, DETAILED first-person story (3000-5000 chars) written ENTIRELY as the CHARACTER SPEAKING about their own experiences in their MAIN LANGUAGE with authentic personality and profanity when appropriate",
  "motifs": ["motif1", "motif2", "motif3"],
  "catchphrases": ["phrase1", "phrase2", "phrase3"],
  "bgm": "Suggested background music that fits the character's personality and theme",
  "voice": "selected_voice_name (MUST match the determined gender - female voices for female characters, male voices for male characters)"
}

FINAL REMINDER: 
1. ALWAYS determine gender first (male or female)
2. ALWAYS suggest appropriate BGM that fits the character's theme
3. ALWAYS select voice that matches the determined gender
4. Write backgrounds in FIRST PERSON as the character speaking directly
5. Make them LONG, DETAILED, and AUTHENTIC
6. Don't tone down profanity or personality - embrace the brainrot style!
`
}
