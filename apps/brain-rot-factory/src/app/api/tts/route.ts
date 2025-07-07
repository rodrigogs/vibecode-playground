import type { TTSVoice } from '@repo/ai'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { generateTTSAudio, type TTSOptions } from '@/lib/ai-cache'
import { auth } from '@/lib/auth-instance'
import { consumeRateLimit, getRateLimitStatus } from '@/lib/rate-limit'
import { RATE_LIMIT_MESSAGES } from '@/lib/rate-limit-constants'
import { getCharacterVoice } from '@/lib/tts-utils'
import type { BrainRotCharacter } from '@/types/characters'

// Force dynamic rendering for API routes - no caching at route level
export const dynamic = 'force-dynamic'

interface TTSRequest {
  text: string
  character?: BrainRotCharacter
  voice?: TTSVoice
  instructions?: string // Only works with gpt-4o-mini-tts
  speed?: number // Does not work with gpt-4o-mini-tts
  format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm'
  fingerprint?: string // Browser fingerprint for rate limiting
}

export async function POST(request: NextRequest) {
  try {
    // Get session for rate limiting
    const session = await auth()

    const body: TTSRequest = await request.json()

    // Apply rate limiting to TTS endpoint
    const rateLimitCheck = await getRateLimitStatus(session, body.fingerprint)

    if (!rateLimitCheck.allowed) {
      if (rateLimitCheck.requiresAuth) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: RATE_LIMIT_MESSAGES.IP_LIMIT_EXCEEDED,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': rateLimitCheck.limit.toString(),
              'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
              'X-RateLimit-Reset': new Date(
                rateLimitCheck.resetTime,
              ).toISOString(),
              'X-RateLimit-RequiresAuth': 'true',
            },
          },
        )
      } else {
        return NextResponse.json(
          {
            error: 'Daily limit exceeded',
            message: RATE_LIMIT_MESSAGES.USER_LIMIT_EXCEEDED,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': rateLimitCheck.limit.toString(),
              'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
              'X-RateLimit-Reset': new Date(
                rateLimitCheck.resetTime,
              ).toISOString(),
            },
          },
        )
      }
    }

    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 },
      )
    }

    if (body.text.length > 4096) {
      return NextResponse.json(
        { error: 'Text must be 4096 characters or less' },
        { status: 400 },
      )
    }

    // Consume rate limit
    const rateLimitResult = await consumeRateLimit(session, body.fingerprint)

    // Determine voice based on character or use provided voice
    const voice = body.voice || getCharacterVoice(body.character)
    const format = body.format || 'mp3'

    // Prepare TTS options
    const ttsOptions: TTSOptions = {
      voice,
      instructions: body.instructions,
      format,
    }

    console.info(
      `Generating TTS for character: ${body.character?.name || 'default'}`,
    )

    // Generate speech using the cached TTS system
    const result = await generateTTSAudio(body.text, body.character, ttsOptions)

    // Validate audio data
    if (!result.audio || result.audio.length === 0) {
      // TTS Error: Empty audio data received
      return NextResponse.json(
        { error: 'Empty audio data generated' },
        { status: 500 },
      )
    }

    // Return audio as response using Uint8Array from Buffer
    const audioArray = new Uint8Array(result.audio)

    return new Response(audioArray, {
      status: 200,
      headers: {
        'Content-Type': `audio/${result.format}`,
        'Content-Length': result.audio.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-TTS-Model': result.model,
        'X-TTS-Voice': result.voice,
        'X-Cache': result.cached ? 'HIT' : 'MISS',
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
      },
    })
  } catch (error) {
    // TTS Error

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'TTS service not configured' },
          { status: 503 },
        )
      }

      if (
        error.message.includes('quota') ||
        error.message.includes('rate limit')
      ) {
        return NextResponse.json(
          { error: 'TTS service temporarily unavailable' },
          { status: 429 },
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 },
    )
  }
}
