import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { generateAIResponse } from '@/app/api/chat/utils/aiService'
import { generateDeveloperCurseResponse } from '@/app/api/chat/utils/language'
import { generateMockResponse } from '@/app/api/chat/utils/mockResponses'
import {
  checkAIConfiguration,
  validateRequest,
} from '@/app/api/chat/utils/validation'

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()
    const validation = validateRequest(requestData)

    // If validation failed, return the error response
    if (validation instanceof NextResponse) {
      return validation
    }

    const { message, character } = validation
    const aiConfig = checkAIConfiguration()

    let response: string

    if (aiConfig.hasOpenAI || aiConfig.hasDeepSeek) {
      try {
        console.log(`Using AI agent for character: ${character.name}`)
        response = await generateAIResponse(character, message, aiConfig)
        console.log(`AI response generated for ${character.name}`)
      } catch (aiError) {
        console.error('AI Error:', aiError)
        console.log('Falling back to developer curse response due to AI error')
        response = generateDeveloperCurseResponse(character, message)
      }
    } else {
      console.log('No AI configuration found, using mock responses')
      response = generateMockResponse(character, message)
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Route Error:', error)

    // Try to get character info from the request for error response
    try {
      const requestData = await request.json()
      const character = requestData?.character

      if (character) {
        const curseResponse = generateDeveloperCurseResponse(character, 'ERROR')
        return NextResponse.json({ response: curseResponse }, { status: 500 })
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
