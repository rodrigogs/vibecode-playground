import type { TTSVoice } from '@repo/ai'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { generateTTSAudio, type TTSOptions } from '@/lib/ai-cache'
import {
  cacheAudioWithToken,
  validateAndConsumeTTSToken,
} from '@/lib/tts-token'
import { getCharacterVoice } from '@/lib/tts-utils'
import type { BrainRotCharacter } from '@/types/characters'

// Force dynamic rendering for API routes - no caching at route level
export const dynamic = 'force-dynamic'

interface TTSRequest {
  character?: BrainRotCharacter
  voice?: TTSVoice
  instructions?: string // Only works with gpt-4o-mini-tts
  format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm'
  ttsToken: string // Required: Token from chat generation to validate TTS request
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json()

    // Validate required TTS token
    if (!body.ttsToken) {
      return NextResponse.json(
        {
          error: 'TTS token required',
          message:
            'A valid TTS token from chat generation is required to generate audio.',
        },
        { status: 400 },
      )
    }

    // Validate and consume the TTS token
    const tokenResult = await validateAndConsumeTTSToken(body.ttsToken)

    if (!tokenResult.valid) {
      return NextResponse.json(
        {
          error: 'Invalid TTS token',
          message:
            tokenResult.error ||
            'The provided TTS token is invalid or has been used.',
        },
        { status: 403 },
      )
    }

    // Check if audio is already cached for replay
    if (tokenResult.tokenData.cachedAudio) {
      console.info(
        `Returning cached audio for token: ${body.ttsToken.substring(0, 12)}...`,
      )

      const cachedAudio = tokenResult.tokenData.cachedAudio
      const audioArray = new Uint8Array(cachedAudio.data)

      return new Response(audioArray, {
        status: 200,
        headers: {
          'Content-Type': cachedAudio.contentType,
          'Content-Length': cachedAudio.data.length.toString(),
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'X-TTS-Model': cachedAudio.model,
          'X-TTS-Voice': cachedAudio.voice,
          'X-Cache': 'TOKEN-HIT', // Indicates audio served from token cache
          'X-TTS-Token': body.ttsToken.substring(0, 12) + '...', // Show partial token for debugging
        },
      })
    }

    // Use the text from the token (ensures consistency with chat generation)
    const textToSpeak = tokenResult.tokenData!.text

    // Validate text length
    if (textToSpeak.length > 4096) {
      return NextResponse.json(
        { error: 'Text must be 4096 characters or less' },
        { status: 400 },
      )
    }

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
      `Generating TTS for character: ${body.character?.name || 'default'} with token: ${body.ttsToken.substring(0, 12)}...`,
    )

    // Generate speech using the cached TTS system with the validated text
    const result = await generateTTSAudio(
      textToSpeak,
      body.character,
      ttsOptions,
    )

    // Validate audio data
    if (!result.audio || result.audio.length === 0) {
      // TTS Error: Empty audio data received
      return NextResponse.json(
        { error: 'Empty audio data generated' },
        { status: 500 },
      )
    }

    // Cache the generated audio with the token for future replay
    await cacheAudioWithToken(
      body.ttsToken,
      result.audio,
      result.format,
      result.voice,
      result.model,
    )

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
        'X-Cache': result.cached ? 'HIT' : 'MISS', // AI cache status
        'X-TTS-Cache': 'GENERATED', // Indicates newly generated and cached
        'X-TTS-Token': body.ttsToken.substring(0, 12) + '...', // Show partial token for debugging
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
