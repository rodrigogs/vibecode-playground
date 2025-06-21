import type { TTSVoice } from '@repo/ai'
import { createTTSService } from '@repo/ai'
import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import { generateAIResponse } from '@/app/api/chat/service'
import { generateDeveloperCurseResponse } from '@/app/api/chat/utils/language'
import { generateMockResponse } from '@/app/api/chat/utils/response'
import { checkAIConfiguration } from '@/app/api/chat/validation'
import type { BrainRotCharacter } from '@/types/characters'

/**
 * Minimum response time for AI answers (in milliseconds)
 * This ensures the AI doesn't seem too instant, making it feel more natural
 */
const MIN_AI_RESPONSE_TIME = 5000 // 5 seconds

/**
 * Get the current minimum AI response time
 * Useful for configuration or testing
 */
export function getMinimumAIResponseTime(): number {
  return MIN_AI_RESPONSE_TIME
}

/**
 * Enforce minimum response time for AI answers
 * This applies a delay to make responses feel more natural
 */
async function enforceMinimumResponseTime<T>(
  responsePromise: Promise<T>,
  startTime: number = Date.now(),
): Promise<T> {
  const [result] = await Promise.all([
    responsePromise,
    new Promise((resolve) => {
      const elapsed = Date.now() - startTime
      const remainingTime = Math.max(0, MIN_AI_RESPONSE_TIME - elapsed)

      if (remainingTime > 0) {
        console.info(`Applying minimum response delay: ${remainingTime}ms`)
      }

      setTimeout(resolve, remainingTime)
    }),
  ])
  return result
}

/**
 * Generate AI response with error handling
 */
async function generateAIResponseWithFallback(
  character: BrainRotCharacter,
  message: string,
  threadId: string,
) {
  try {
    const aiConfig = checkAIConfiguration()
    const response = await generateAIResponse(
      character,
      message,
      aiConfig,
      threadId,
    )
    return {
      response,
      source: 'ai' as const,
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error('AI Error:', error)
    return {
      response: generateDeveloperCurseResponse(character, message),
      source: 'fallback' as const,
      timestamp: Date.now(),
    }
  }
}

/**
 * TTS Cache Types and Functions
 */
interface TTSOptions {
  voice?: string
  instructions?: string
  format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm'
}

// Internal cache result - uses Uint8Array for better serialization
interface TTSCacheResult {
  audioData: number[] // Buffer converted to array for serialization
  size: number
  format: string
  model: string
  voice: string
  timestamp: number
}

interface TTSResult {
  audio: Buffer
  size: number
  format: string
  model: string
  voice: string
  cached: boolean
  timestamp: number
}

/**
 * Check if TTS request should be cached based on text length and content
 */
function shouldCacheTTS(text: string): boolean {
  const trimmed = text.trim()
  return (
    trimmed.length >= 5 && trimmed.length <= 1000 && /[a-zA-Z0-9]/.test(trimmed)
  )
}

/**
 * Generate TTS audio with error handling
 */
async function generateTTSAudioWithFallback(
  text: string,
  character?: BrainRotCharacter,
  options: TTSOptions = {},
): Promise<TTSCacheResult> {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    const tts = createTTSService({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Generate brain-rot specific instructions
    const { generateBrainRotInstructions } = await import('@/lib/tts-utils')
    const brainRotInstructions = generateBrainRotInstructions(
      character,
      options.instructions,
    )

    const ttsOptions = {
      model: 'gpt-4o-mini-tts' as const,
      voice: (options.voice || 'ash') as TTSVoice,
      response_format: options.format || 'mp3',
      instructions: brainRotInstructions,
    }

    const result = await tts.generateSpeech(text, ttsOptions)

    // Convert Buffer to array for serialization compatibility
    return {
      audioData: Array.from(result.audio),
      size: result.audio.length,
      format: result.format,
      model: result.model,
      voice: result.voice,
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error('TTS Error:', error)
    throw error
  }
}

/**
 * Cached TTS generator using Next.js unstable_cache
 */
const getCachedTTSAudio = unstable_cache(
  async (
    text: string,
    character?: BrainRotCharacter,
    options: TTSOptions = {},
  ): Promise<TTSCacheResult> => {
    console.info(
      `TTS Cache miss - generating audio for: ${character?.name || 'default'}`,
    )
    return await generateTTSAudioWithFallback(text, character, options)
  },
  ['tts-audio'],
  {
    revalidate: 60 * 60 * 24 * 7, // 7 days (TTS audio doesn't change)
    tags: ['tts-audio'],
  },
)

/**
 * Request-level memoization for TTS using React cache
 * This prevents duplicate TTS requests within the same render cycle
 */
export const generateTTSAudio = cache(
  async (
    text: string,
    character?: BrainRotCharacter,
    options: TTSOptions = {},
  ): Promise<TTSResult> => {
    // Only cache TTS for reasonable text
    if (!shouldCacheTTS(text)) {
      console.info(`Not caching TTS for text: "${text.slice(0, 50)}..."`)
      const result = await generateTTSAudioWithFallback(
        text,
        character,
        options,
      )
      // Convert array back to Buffer for the result
      return {
        audio: Buffer.from(result.audioData),
        size: result.size,
        format: result.format,
        model: result.model,
        voice: result.voice,
        timestamp: result.timestamp,
        cached: false,
      }
    }

    // Use cached TTS function
    const result = await getCachedTTSAudio(text, character, options)

    // Handle the case where audioData might be undefined due to cache issues
    const audioArray = result.audioData || []
    if (!Array.isArray(audioArray) || audioArray.length === 0) {
      console.error(
        'TTS cache error: audioData is invalid:',
        typeof result.audioData,
        'length:',
        Array.isArray(audioArray) ? audioArray.length : 'N/A',
      )

      // Invalidate the corrupted cache entry
      const { revalidateTag } = await import('next/cache')
      revalidateTag('tts-audio')
      console.info('Invalidated TTS cache due to corruption')

      // Fallback to generating fresh TTS
      const freshResult = await generateTTSAudioWithFallback(
        text,
        character,
        options,
      )
      return {
        audio: Buffer.from(freshResult.audioData),
        size: freshResult.size,
        format: freshResult.format,
        model: freshResult.model,
        voice: freshResult.voice,
        timestamp: freshResult.timestamp,
        cached: false,
      }
    }

    // Convert array back to Buffer for the result
    return {
      audio: Buffer.from(audioArray),
      size: result.size,
      format: result.format,
      model: result.model,
      voice: result.voice,
      timestamp: result.timestamp,
      cached: true,
    }
  },
)

/**
 * Export TTS types for use in API routes
 */
export type { TTSOptions, TTSResult }

/**
 * Request-level memoization using React cache
 * This prevents duplicate requests within the same render cycle
 */
export const generateResponse = cache(
  async (character: BrainRotCharacter, message: string, threadId: string) => {
    const startTime = Date.now()
    const aiConfig = checkAIConfiguration()
    const hasAI = aiConfig.hasOpenAI || aiConfig.hasDeepSeek

    // Don't cache responses when using LangGraph checkpoints as they handle state persistence
    console.info(
      `Generating response for message: "${message.slice(0, 50)}..." with thread: ${threadId}`,
    )

    if (hasAI) {
      // Apply minimum response time for AI responses
      const result = await enforceMinimumResponseTime(
        generateAIResponseWithFallback(character, message, threadId),
        startTime,
      )
      return { ...result, cached: false }
    }

    return {
      response: generateMockResponse(character, message),
      source: 'mock' as const,
      cached: false,
      timestamp: Date.now(),
    }
  },
)
