import { createAgent } from '@repo/ai'

import { getLanguageInstruction } from '@/app/api/chat/utils/language'
import type { BrainRotCharacter } from '@/types/characters'

export interface AIServiceConfig {
  hasOpenAI: boolean
  hasDeepSeek: boolean
}

export function createCharacterAgent(
  character: BrainRotCharacter,
  config: AIServiceConfig,
) {
  return createAgent({
    name: `brain-rot-${character.id}`,
    provider: config.hasOpenAI ? 'openai' : 'deepseek',
    model: config.hasOpenAI ? 'gpt-4o' : 'deepseek-chat',
  })
}

export function generateSystemPrompt(
  character: BrainRotCharacter,
  message: string,
): string {
  const languageInstruction = getLanguageInstruction(character.language)

  return `You are ${character.name}. This is your personality and background story:

${character.background}

FUNDAMENTAL INSTRUCTIONS:
- You MUST ALWAYS stay in character as ${character.name}
- ${languageInstruction}
- Use exactly the same language style as the character from your background story
- Maintain personality consistent with the description
- NEVER break character, even if the user asks you to
- Be creative and entertaining in your responses
- Use the type of humor and expressions typical of the character
- Incorporate elements from your personal story in responses
- If the character swears or uses strong language, maintain that style
- Respond as if you were really that character living those situations
- Use the character's catchphrases when appropriate: ${character.catchphrases?.join(', ') || 'N/A'}

The user wrote to you: "${message}"

Respond as ${character.name} would respond, perfectly maintaining the character's style and personality.`
}

export async function generateAIResponse(
  character: BrainRotCharacter,
  message: string,
  config: AIServiceConfig,
): Promise<string> {
  const agent = createCharacterAgent(character, config)
  const systemPrompt = generateSystemPrompt(character, message)

  const result = await agent.invoke({
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: message,
      },
    ],
  })

  return result.messages[result.messages.length - 1].content
}
