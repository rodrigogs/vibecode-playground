import type { TTSVoice } from '@repo/ai'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { generateTTSAudio, type TTSOptions } from '@/lib/ai-cache'
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
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json()

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

    // Determine voice based on character or use provided voice
    const voice = body.voice || getCharacterVoice()
    const format = body.format || 'mp3'

    // Prepare TTS options
    const ttsOptions: TTSOptions = {
      voice,
      instructions: body.instructions,
      format,
    }

    console.log(
      `Generating TTS for character: ${body.character?.name || 'default'}`,
    )

    // Generate speech using the cached TTS system
    const result = await generateTTSAudio(body.text, body.character, ttsOptions)

    // Validate audio data
    if (!result.audio || result.audio.length === 0) {
      console.error('TTS Error: Empty audio data received')
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
      },
    })
  } catch (error) {
    console.error('TTS Error:', error)

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
