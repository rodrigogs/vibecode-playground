import { type NextRequest, NextResponse } from 'next/server'

import { isRewardsEnabled } from '@/lib/features'
import {
  createValidationErrorResponse,
  validateAdTokenRequest,
} from '@/lib/middleware/validation'
import { generateAdToken } from '@/lib/services/ad-token'
import { processFingerprintData } from '@/lib/utils/fingerprint'

/**
 * POST /api/rewarded-ad/generate-token
 *
 * Generates a secure ad token that can be used to claim rewards
 * after watching an ad. The token is signed with JWT and includes
 * the user's fingerprint for validation.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if rewards system is enabled
    if (!isRewardsEnabled()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rewards system is currently disabled',
        },
        { status: 503 },
      )
    }

    // Validate and sanitize request
    const validationResult = await validateAdTokenRequest(request)

    // If validation failed, return the error response
    if (!validationResult.isValid) {
      return createValidationErrorResponse(validationResult.error!)
    }

    const { fingerprintData } = validationResult.data!

    // Process fingerprint data to get fingerprint hash
    const { fingerprint } = processFingerprintData(fingerprintData)

    // Generate secure ad token with processed fingerprint hash
    const adToken = await generateAdToken(fingerprint || '')

    return NextResponse.json({
      success: true,
      adToken,
      expiresIn: 300, // 5 minutes
      message: 'Ad token generated successfully',
    })
  } catch (error) {
    console.error('Error generating ad token:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Token generation failed',
        message: 'Unable to generate ad token. Please try again.',
      },
      { status: 500 },
    )
  }
}
