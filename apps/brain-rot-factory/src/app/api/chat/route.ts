import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { validateRequest } from '@/app/api/chat/validation'
import { generateResponse } from '@/lib/ai-cache'
import { auth } from '@/lib/auth-instance'
import { consumeRateLimit, getRateLimitStatus } from '@/lib/rate-limit'
import { RATE_LIMIT_MESSAGES } from '@/lib/rate-limit-constants'
import type { BrainRotCharacter } from '@/types/characters'

// Force dynamic rendering for API routes - no caching at route level
export const dynamic = 'force-dynamic'

/**
 * Generate a thread ID for LangGraph conversation persistence
 */
function generateThreadId(): string {
  return `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export async function POST(request: NextRequest) {
  let requestData: unknown
  let character: BrainRotCharacter | undefined

  try {
    // Get session for rate limiting
    const session = await auth()

    // Check rate limit before processing request
    const rateLimitCheck = await getRateLimitStatus(session)

    if (!rateLimitCheck.allowed) {
      if (rateLimitCheck.requiresAuth) {
        // User has exceeded IP limit and needs to authenticate
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: RATE_LIMIT_MESSAGES.IP_LIMIT_EXCEEDED,
            rateLimitInfo: {
              limit: rateLimitCheck.limit,
              remaining: rateLimitCheck.remaining,
              resetTime: rateLimitCheck.resetTime,
              requiresAuth: true,
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
            },
          },
        )
      }
    }

    requestData = await request.json()
    const validation = validateRequest(requestData)

    // If validation failed, return the error response
    if (validation instanceof NextResponse) {
      return validation
    }

    const { message } = validation
    character = validation.character
    const sessionId = validation.threadId || generateThreadId()

    // Use sessionId as threadId for LangGraph conversation persistence
    const threadId = `${character.id}_${sessionId}`

    // Consume rate limit - this increments the counter
    const rateLimitResult = await consumeRateLimit(session)

    // Use the cached response generator from ai-cache.ts
    const requestStartTime = Date.now()
    console.info(`Generating response for character: ${character.name}`)
    const result = await generateResponse(character, message, threadId)
    const totalTime = Date.now() - requestStartTime
    console.info(
      `Response generated for ${character.name} (cached: ${result.cached}, source: ${result.source}, time: ${totalTime}ms)`,
    )

    // Include rate limit info in successful response
    return NextResponse.json(
      {
        response: result.response,
        threadId: sessionId, // Return the original sessionId as threadId for frontend
        rateLimitInfo: {
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          requiresAuth: rateLimitResult.requiresAuth,
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(
            rateLimitResult.resetTime,
          ).toISOString(),
          ...(rateLimitResult.requiresAuth && {
            'X-RateLimit-RequiresAuth': 'true',
          }),
        },
      },
    )
  } catch (error) {
    console.error('Route Error:', error)

    // For errors, we'll generate a simple fallback without caching
    if (character) {
      // Simple fallback response without importing the curse generator
      const errorResponse = `Yo ${character.name} is having some technical difficulties right now. Try again in a sec!`
      return NextResponse.json({ response: errorResponse }, { status: 500 })
    }

    // Try to get character info from the request for error response
    try {
      if (!requestData) {
        requestData = await request.json()
      }
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
