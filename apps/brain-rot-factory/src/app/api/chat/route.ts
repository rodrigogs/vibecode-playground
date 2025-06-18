import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { validateRequest } from '@/app/api/chat/validation'
import { generateResponse } from '@/lib/ai-cache'
import type { BrainRotCharacter } from '@/types/characters'

// Force dynamic rendering for API routes - no caching at route level
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let requestData: unknown
  let character: BrainRotCharacter | undefined

  try {
    requestData = await request.json()
    const validation = validateRequest(requestData)

    // If validation failed, return the error response
    if (validation instanceof NextResponse) {
      return validation
    }

    const { message } = validation
    character = validation.character

    // Use the cached response generator from ai-cache.ts
    const requestStartTime = Date.now()
    console.log(`Generating response for character: ${character.name}`)
    const result = await generateResponse(character, message)
    const totalTime = Date.now() - requestStartTime
    console.log(
      `Response generated for ${character.name} (cached: ${result.cached}, source: ${result.source}, time: ${totalTime}ms)`,
    )

    return NextResponse.json({ response: result.response })
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
