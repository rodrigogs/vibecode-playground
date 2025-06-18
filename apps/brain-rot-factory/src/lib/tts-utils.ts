import type { BrainRotCharacter } from '@/types/characters'

/**
 * Generate Brain Rot Factory specific TTS instructions
 * Tailored for the chaotic, energetic, and surreal nature of brain rot content
 */
export function generateBrainRotInstructions(
  character?: BrainRotCharacter,
  customInstructions?: string,
): string {
  // Base Brain Rot Factory instructions
  const baseInstructions = `
You are speaking for the Brain Rot Factory, an Italian/international internet culture project featuring absurd, energetic, and chaotic characters.

CORE VOICE STYLE:
- Use an extremely energetic, enthusiastic, and slightly chaotic delivery
- Speak with the passion and intensity of an Italian content creator
- Add dramatic emphasis on key words and catchphrases
- Use a pace that varies from rapid-fire excitement to dramatic pauses
- Sound like you're performing for an audience that loves absurd internet content
- Channel the energy of viral TikTok creators and Italian YouTube personalities
  `.trim()

  // Character-specific instructions
  let characterInstructions = ''
  if (character) {
    const personalityTraits = {
      'tralalero':
        'Speak like an Italian legend with crude humor. Use dramatic, over-the-top delivery with Italian passion. Emphasize curse words and catchphrases with gusto.',
      'tung-sahur':
        'Use rhythmic, percussive delivery that matches the TUNG TUNG sounds. Speak with mysterious, slightly spooky energy. Add Indonesian accent hints.',
      'bombardiro-crocodilo':
        'Aggressive, militaristic tone with explosive energy. Sound like a war machine crossed with an animal. Dramatic and destructive.',
      'lirili-larila':
        'Poetic, whimsical, and surreal delivery. Speak like a magical creature telling a fairy tale. Use sing-song rhythm.',
      'boneca-ambalabu':
        'Mysterious, slightly unsettling tone. Speak like an enigmatic entity that confuses scientists. Add Indonesian pronunciation.',
      'brr-brr-patapim':
        'Eccentric forest guardian voice. Childlike wonder mixed with ancient wisdom. Emphasize the "brr brr" sounds.',
      'chimpanzini-bananini':
        'Energetic monkey-like delivery. Playful, muscular, and banana-obsessed. Use chimp-like enthusiasm.',
      'capuccino-assassino':
        'Smooth ninja assassin voice with coffee passion. Dangerous but caffeinated. Italian pronunciation.',
    }

    const trait =
      personalityTraits[character.id as keyof typeof personalityTraits]
    if (trait) {
      characterInstructions = `\n\nCHARACTER PERSONALITY: ${character.name} - ${trait}`
    }

    // Add language-specific instructions
    if (character.language === 'italian') {
      characterInstructions +=
        '\n\nLANGUAGE: Speak with Italian accent and pronunciation. Add Italian emotional expressiveness.'
    } else if (character.language === 'indonesian') {
      characterInstructions +=
        '\n\nLANGUAGE: Add subtle Indonesian pronunciation hints while keeping it understandable.'
    }

    // Add catchphrase emphasis
    if (character.catchphrases && character.catchphrases.length > 0) {
      characterInstructions += `\n\nCATCHPHRASES: When saying these phrases, add extra dramatic emphasis: ${character.catchphrases.join(', ')}`
    }
  }

  // Combine all instructions
  const finalInstructions = [
    baseInstructions,
    characterInstructions,
    customInstructions
      ? `\n\nADDITIONAL INSTRUCTIONS: ${customInstructions}`
      : '',
    '\n\nREMEMBER: You are creating content for brain rot enthusiasts who love chaotic, energetic, and absurd internet culture!',
  ]
    .filter(Boolean)
    .join('')

  return finalInstructions
}

/**
 * Get appropriate voice for character
 * Now using the requested "ash" voice which is available in the latest OpenAI TTS API
 */
export function getCharacterVoice(): 'ash' {
  // This can be enhanced with character-specific voice mapping
  return 'ash'
}
