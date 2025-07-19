import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { generateResponse } from '@/lib/ai-cache'
import { auth } from '@/lib/auth-instance'
import {
  createValidationErrorResponse,
  validateChatRequest,
} from '@/lib/middleware/validation'
import { consumeRateLimit, getRateLimitStatus } from '@/lib/rate-limit'
import { RATE_LIMIT_MESSAGES } from '@/lib/rate-limit-constants'
import { generateTTSToken, storeTTSToken } from '@/lib/tts-token'
import type { BrainRotCharacter } from '@/types/characters'

// Force dynamic rendering for API routes - no caching at route level
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let character: BrainRotCharacter | undefined

  try {
    // Get session for rate limiting
    const session = await auth()

    // Validate and sanitize request
    const validationResult = await validateChatRequest(request)

    // If validation failed, return the error response
    if (!validationResult.isValid) {
      return createValidationErrorResponse(validationResult.error!)
    }

    const { message, threadId, fingerprint } = validationResult.data!
    character = validationResult.data!.character as BrainRotCharacter

    // Check enhanced rate limit with browser fingerprinting
    const rateLimitCheck = await getRateLimitStatus(session, fingerprint)

    if (!rateLimitCheck.allowed) {
      if (rateLimitCheck.requiresAuth) {
        // User has exceeded limit and needs to authenticate
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: RATE_LIMIT_MESSAGES.IP_LIMIT_EXCEEDED,
            rateLimitInfo: {
              limit: rateLimitCheck.limit,
              remaining: rateLimitCheck.remaining,
              resetTime: rateLimitCheck.resetTime,
              requiresAuth: true,
              method: rateLimitCheck.method,
            },
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
              'X-RateLimit-Method': rateLimitCheck.method,
            },
          },
        )
      } else {
        // Logged-in user has exceeded daily limit
        return NextResponse.json(
          {
            error: 'Daily limit exceeded',
            message: RATE_LIMIT_MESSAGES.USER_LIMIT_EXCEEDED,
            rateLimitInfo: {
              limit: rateLimitCheck.limit,
              remaining: rateLimitCheck.remaining,
              resetTime: rateLimitCheck.resetTime,
              requiresAuth: false,
              method: rateLimitCheck.method,
            },
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': rateLimitCheck.limit.toString(),
              'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
              'X-RateLimit-Reset': new Date(
                rateLimitCheck.resetTime,
              ).toISOString(),
              'X-RateLimit-Method': rateLimitCheck.method,
            },
          },
        )
      }
    }

    // Smart thread management for conversation continuity
    // If threadId provided, use it to continue existing conversation
    // If not provided, generate new session for new conversation
    const userIdentifier = session?.user?.id || 'anonymous'
    const sessionId =
      threadId || `${userIdentifier}_${character.id}_${Date.now()}`

    // Use sessionId as threadId for LangGraph conversation persistence
    const threadIdForAI = `${character.id}_${sessionId}`

    // Consume enhanced rate limit - this increments the counter
    const rateLimitResult = await consumeRateLimit(session, fingerprint)

    // Use the cached response generator from ai-cache.ts
    const requestStartTime = Date.now()
    console.info(`Generating response for character: ${character.name}`)
    const result = await generateResponse(character, message, threadIdForAI)
    const totalTime = Date.now() - requestStartTime
    console.info(
      `Response generated for ${character.name} (cached: ${result.cached}, source: ${result.source}, time: ${totalTime}ms)`,
    )

    // Generate TTS token for this chat response
    const ttsToken = generateTTSToken()
    await storeTTSToken(ttsToken, result.response, character.id, sessionId)

    // Include rate limit info and TTS token in successful response
    return NextResponse.json(
      {
        response: result.response,
        threadId: sessionId, // Return the server-generated sessionId as threadId for frontend
        ttsToken, // Include the TTS token for audio generation
        rateLimitInfo: {
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          requiresAuth: rateLimitResult.requiresAuth,
          method: rateLimitResult.method,
          confidence: rateLimitResult.confidence,
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(
            rateLimitResult.resetTime,
          ).toISOString(),
          'X-RateLimit-Method': rateLimitResult.method,
          ...(rateLimitResult.requiresAuth && {
            'X-RateLimit-RequiresAuth': 'true',
          }),
          ...(rateLimitResult.confidence && {
            'X-RateLimit-Confidence': rateLimitResult.confidence.toFixed(2),
          }),
        },
      },
    )
  } catch {
    // Route Error

    // For errors, we'll generate a simple fallback without caching
    if (character) {
      // Simple fallback response without importing the curse generator
      const errorResponse = `Yo ${character.name} is having some technical difficulties right now. Try again in a sec!`
      return NextResponse.json({ response: errorResponse }, { status: 500 })
    }

    // Try to get character info from the request for error response
    try {
      const requestData = await request.json()
      const characterFromRequest = (
        requestData as { character?: BrainRotCharacter }
      )?.character

      if (characterFromRequest) {
        const errorResponse = `Yo ${characterFromRequest.name} is having some technical difficulties right now. Try again in a sec!`
        return NextResponse.json({ response: errorResponse }, { status: 500 })
      }
    } catch {
      // If we can't parse the request, just return a generic error
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
