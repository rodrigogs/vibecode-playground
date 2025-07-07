/**
 * TTS Token System
 *
 * This system ensures that TTS generation can only happen for valid chat responses.
 * Each chat response generates a unique token that can be used once for TTS.
 * This maintains a 1:1 ratio between chat generation and TTS generation.
 */

import { cache } from '@/lib/backend-cache'

// TTS token configuration
export const TTS_TOKEN_CONFIG = {
  TOKEN_TTL: 30 * 60 * 1000, // 30 minutes - tokens expire after 30 min
  TOKEN_PREFIX: 'tts_token:',
} as const

export interface TTSTokenData {
  text: string // The text that was generated in chat
  characterId?: string // The character that generated the text
  sessionId?: string // Optional session tracking
  createdAt: number
  usedAt?: number // When the token was consumed for TTS
  // Audio caching for replay functionality
  cachedAudio?: {
    data: Buffer // The generated audio data
    format: string // Audio format (mp3, wav, etc.)
    voice: string // Voice used for generation
    model: string // TTS model used
    contentType: string // MIME type for HTTP response
  }
}

export interface TTSTokenResult {
  valid: boolean
  tokenData?: TTSTokenData
  error?: string
}

/**
 * Generate a unique TTS token for a chat response
 */
export function generateTTSToken(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  return `tts_${timestamp}_${random}`
}

/**
 * Store TTS token data in cache
 */
export async function storeTTSToken(
  token: string,
  text: string,
  characterId?: string,
  sessionId?: string,
): Promise<void> {
  const tokenData: TTSTokenData = {
    text,
    characterId,
    sessionId,
    createdAt: Date.now(),
  }

  const cacheKey = `${TTS_TOKEN_CONFIG.TOKEN_PREFIX}${token}`
  await cache.set(cacheKey, tokenData, TTS_TOKEN_CONFIG.TOKEN_TTL)

  console.info(
    `TTS token stored: ${token.substring(0, 12)}... for ${text.length} chars`,
  )
}

/**
 * Validate a TTS token and check for cached audio
 * Returns cached audio if available, or marks token for audio generation
 */
export async function validateAndConsumeTTSToken(
  token: string,
): Promise<TTSTokenResult> {
  if (!token || typeof token !== 'string') {
    return {
      valid: false,
      error: 'Invalid token format',
    }
  }

  const cacheKey = `${TTS_TOKEN_CONFIG.TOKEN_PREFIX}${token}`
  const tokenData = await cache.get<TTSTokenData>(cacheKey)

  if (!tokenData) {
    return {
      valid: false,
      error: 'Token not found or expired',
    }
  }

  // If audio is already cached, return it immediately (allow replay)
  if (tokenData.cachedAudio) {
    console.info(
      `TTS token replay: ${token.substring(0, 12)}... returning cached audio`,
    )

    return {
      valid: true,
      tokenData,
    }
  }

  // If token was already used but no cached audio, something went wrong
  if (tokenData.usedAt) {
    return {
      valid: false,
      error: 'Token already used but no cached audio available',
    }
  }

  // Mark token as used (first-time generation)
  tokenData.usedAt = Date.now()

  // Store the updated token data (audio will be cached after generation)
  const remainingTTL =
    tokenData.createdAt + TTS_TOKEN_CONFIG.TOKEN_TTL - Date.now()
  if (remainingTTL > 0) {
    await cache.set(cacheKey, tokenData, remainingTTL)
  }

  console.info(
    `TTS token consumed for generation: ${token.substring(0, 12)}... for "${tokenData.text.substring(0, 50)}..."`,
  )

  return {
    valid: true,
    tokenData,
  }
}

/**
 * Check if a token is valid without consuming it
 */
export async function checkTTSToken(token: string): Promise<TTSTokenResult> {
  if (!token || typeof token !== 'string') {
    return {
      valid: false,
      error: 'Invalid token format',
    }
  }

  const cacheKey = `${TTS_TOKEN_CONFIG.TOKEN_PREFIX}${token}`
  const tokenData = await cache.get<TTSTokenData>(cacheKey)

  if (!tokenData) {
    return {
      valid: false,
      error: 'Token not found or expired',
    }
  }

  if (tokenData.usedAt) {
    return {
      valid: false,
      error: 'Token already used',
    }
  }

  return {
    valid: true,
    tokenData,
  }
}

/**
 * Clean up expired tokens (can be called periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  // This would ideally be handled by the cache TTL, but we can implement
  // manual cleanup if needed for audit purposes
  const allKeys = await cache.keys(`${TTS_TOKEN_CONFIG.TOKEN_PREFIX}*`)
  let cleaned = 0

  for (const key of allKeys) {
    const tokenData = await cache.get<TTSTokenData>(key)
    if (
      !tokenData ||
      Date.now() - tokenData.createdAt > TTS_TOKEN_CONFIG.TOKEN_TTL
    ) {
      await cache.delete(key)
      cleaned++
    }
  }

  if (cleaned > 0) {
    console.info(`Cleaned up ${cleaned} expired TTS tokens`)
  }

  return cleaned
}

/**
 * Cache generated audio with the TTS token for replay functionality
 */
export async function cacheAudioWithToken(
  token: string,
  audioData: Buffer,
  format: string,
  voice: string,
  model: string,
): Promise<void> {
  const cacheKey = `${TTS_TOKEN_CONFIG.TOKEN_PREFIX}${token}`
  const tokenData = await cache.get<TTSTokenData>(cacheKey)

  if (!tokenData) {
    console.warn(
      `Attempted to cache audio for non-existent token: ${token.substring(0, 12)}...`,
    )
    return
  }

  // Add cached audio to token data
  tokenData.cachedAudio = {
    data: audioData,
    format,
    voice,
    model,
    contentType: `audio/${format}`,
  }

  // Update the token with cached audio, keeping the original TTL
  const remainingTTL =
    tokenData.createdAt + TTS_TOKEN_CONFIG.TOKEN_TTL - Date.now()
  if (remainingTTL > 0) {
    await cache.set(cacheKey, tokenData, remainingTTL)
    console.info(
      `Audio cached for token: ${token.substring(0, 12)}... (${audioData.length} bytes, ${format})`,
    )
  }
}
