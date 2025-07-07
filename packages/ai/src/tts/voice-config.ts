import type { OpenAITTSVoices } from '../types'

export interface VoiceConfig {
  gender: 'male' | 'female'
}

export type VoiceConfigs = {
  [K in OpenAITTSVoices]: VoiceConfig
}

export const VOICE_CONFIGS: VoiceConfigs = {
  // Male voices
  ash: {
    gender: 'male',
  },
  ballad: {
    gender: 'male',
  },
  echo: {
    gender: 'male',
  },
  onyx: {
    gender: 'male',
  },
  verse: {
    gender: 'male',
  },

  // Female voices
  alloy: {
    gender: 'female',
  },
  coral: {
    gender: 'female',
  },
  fable: {
    gender: 'female',
  },
  nova: {
    gender: 'female',
  },
  sage: {
    gender: 'female',
  },
  shimmer: {
    gender: 'female',
  },
}

/**
 * Get voices by gender
 */
export function getVoicesByGender(
  gender: 'male' | 'female',
): OpenAITTSVoices[] {
  return (Object.entries(VOICE_CONFIGS) as [OpenAITTSVoices, VoiceConfig][])
    .filter(([, config]) => config.gender === gender)
    .map(([voice]) => voice)
}

/**
 * Get male voices
 */
export function getMaleVoices(): OpenAITTSVoices[] {
  return getVoicesByGender('male')
}

/**
 * Get female voices
 */
export function getFemaleVoices(): OpenAITTSVoices[] {
  return getVoicesByGender('female')
}

/**
 * Get voice configuration
 */
export function getVoiceConfig(voice: OpenAITTSVoices): VoiceConfig {
  return VOICE_CONFIGS[voice]
}

/**
 * Check if voice is male
 */
export function isMaleVoice(voice: OpenAITTSVoices): boolean {
  return VOICE_CONFIGS[voice].gender === 'male'
}

/**
 * Check if voice is female
 */
export function isFemaleVoice(voice: OpenAITTSVoices): boolean {
  return VOICE_CONFIGS[voice].gender === 'female'
}

/**
 * Get a random voice by gender
 */
export function getRandomVoiceByGender(
  gender: 'male' | 'female',
): OpenAITTSVoices {
  const voices = getVoicesByGender(gender)
  if (voices.length === 0) {
    throw new Error(`No voices found for gender: ${gender}`)
  }
  return voices[Math.floor(Math.random() * voices.length)]!
}

/**
 * Voice statistics
 */
export const VOICE_STATS = {
  total: Object.keys(VOICE_CONFIGS).length,
  male: getMaleVoices().length,
  female: getFemaleVoices().length,
  maleVoices: getMaleVoices(),
  femaleVoices: getFemaleVoices(),
} as const
