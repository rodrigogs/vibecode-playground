import {
  getFemaleVoices,
  getMaleVoices,
  getRandomVoiceByGender,
  isFemaleVoice,
  isMaleVoice,
  type OpenAITTSVoices,
} from '@repo/ai'

import type { BrainRotCharacter } from '@/types/characters'

/**
 * Get a random voice from all available voices
 */
export function getRandomVoice(): OpenAITTSVoices {
  // Use the existing random voice function with random gender
  const gender = Math.random() > 0.5 ? 'male' : 'female'
  return getRandomVoiceByGender(gender)
}

/**
 * Get the gender of a voice
 */
export function getVoiceGender(voice: OpenAITTSVoices): 'male' | 'female' {
  if (isMaleVoice(voice)) return 'male'
  if (isFemaleVoice(voice)) return 'female'

  // This should never happen if voice config is complete, but fallback to male
  console.warn(`Unknown gender for voice: ${voice}, defaulting to male`)
  return 'male'
}

/**
 * Check if a voice string is valid
 */
function isValidVoice(voice: string): boolean {
  const allVoices = [...getMaleVoices(), ...getFemaleVoices()]
  return allVoices.includes(voice as OpenAITTSVoices)
}

/**
 * Get the optimal voice for a brain-rot character
 * Priority order:
 * 1. Character's assigned voice (from characters.json) - if it matches character's gender
 * 2. Random voice matching character's gender
 * 3. Random fallback
 */
export function getCharacterVoice(
  character?: BrainRotCharacter,
): OpenAITTSVoices {
  console.log('🎤 getCharacterVoice called for character:', character?.name)
  console.log('🎤 Character voice field:', character?.voice)
  console.log('🎤 Character gender field:', character?.gender)

  if (character) {
    // First priority: use assigned voice from character data if valid and matches gender
    if (character.voice && isValidVoice(character.voice)) {
      const assignedVoice = character.voice as OpenAITTSVoices
      const voiceGender = getVoiceGender(assignedVoice)

      console.log(
        `🎤 Character "${character.name}" has assigned voice: ${assignedVoice} (${voiceGender})`,
      )

      // Use the assigned voice if it matches the character's gender, or if character has no gender specified
      if (!character.gender || voiceGender === character.gender) {
        console.log(
          `🎤 Using assigned voice "${assignedVoice}" for character "${character.name}"`,
        )
        return assignedVoice
      }

      // If voice doesn't match character gender, log a warning and fall back to gender-based selection
      console.warn(
        `Voice "${assignedVoice}" (${voiceGender}) doesn't match character "${character.name}" gender (${character.gender}). Using gender-based fallback.`,
      )
    } else {
      console.log(
        `🎤 Character "${character.name}" has no valid voice assigned. Voice: ${character.voice}, Valid: ${character.voice ? isValidVoice(character.voice) : 'N/A'}`,
      )
    }

    // Second priority: get a random voice based on character's gender
    if (character.gender === 'male' || character.gender === 'female') {
      const genderVoice = getRandomVoiceByGender(character.gender)
      console.log(
        `🎤 Using gender-based voice "${genderVoice}" for ${character.gender} character "${character.name}"`,
      )
      return genderVoice
    }
  }

  // Default fallback: randomly choose between male and female voices
  const gender = Math.random() > 0.5 ? 'male' : 'female'
  const fallbackVoice = getRandomVoiceByGender(gender)
  console.log(
    `🎤 Using fallback voice "${fallbackVoice}" (${gender}) for character "${character?.name || 'unknown'}"`,
  )
  return fallbackVoice
}

/**
 * Voice statistics and information
 */
export const VOICE_STATS = {
  total: getMaleVoices().length + getFemaleVoices().length,
  male: getMaleVoices().length,
  female: getFemaleVoices().length,
  maleVoices: getMaleVoices(),
  femaleVoices: getFemaleVoices(),
  allVoices: [...getMaleVoices(), ...getFemaleVoices()],
} as const

// Re-export functions from AI package for convenience
export {
  getFemaleVoices,
  getMaleVoices,
  getRandomVoiceByGender,
  isFemaleVoice,
  isMaleVoice,
}
