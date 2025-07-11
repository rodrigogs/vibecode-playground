import { NextResponse } from 'next/server'

import type { BrainRotCharacter } from '@/types/characters'

export interface RequestData {
  message?: string
  character?: BrainRotCharacter
  threadId?: string
  fingerprint?: string // Browser fingerprint for enhanced rate limiting
}

export interface ValidatedRequest {
  message: string
  character: BrainRotCharacter
  threadId?: string
  fingerprint?: string
}

export function validateRequest(
  requestData: unknown,
): ValidatedRequest | NextResponse {
  const { message, character, threadId, fingerprint } =
    requestData as RequestData

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  if (!character) {
    return NextResponse.json(
      { error: 'Character selection is required' },
      { status: 400 },
    )
  }

  return {
    message,
    character: character as BrainRotCharacter,
    threadId,
    fingerprint,
  }
}

export function checkAIConfiguration() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY

  return { hasOpenAI, hasDeepSeek }
}
