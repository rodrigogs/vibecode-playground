import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'

import { auth } from '@/lib/auth-instance'
import { cache } from '@/lib/backend-cache'
import { isRewardsEnabled } from '@/lib/features'
import { checkRateLimit } from '@/lib/rate-limit'
import { validateAdToken } from '@/lib/services/ad-token'
import { cacheKeys } from '@/lib/utils/cache-keys'
import { processFingerprintData } from '@/lib/utils/fingerprint'
import { getIPForCacheKey } from '@/lib/utils/ip'

// Rate limit on ad watching to prevent abuse
const AD_RATE_LIMIT = {
  MAX_ADS_PER_HOUR: 3, // Users can watch max 3 ads per hour
  MAX_ADS_PER_DAY: 10, // Users can watch max 10 ads per day
  RESET_TIME: 60 * 60 * 1000, // 1 hour
  DAILY_RESET_TIME: 24 * 60 * 60 * 1000, // 24 hours
}

async function addBonusCredit(session: Session | null): Promise<void> {
  const ip = await getIPForCacheKey()
  const userId = session?.user?.id

  // Create the same key structure as rate limiting
  const key = cacheKeys.bonusCredits.getKey(userId, ip)

  const current = (await cache.get<number>(key)) || 0
  await cache.set(key, current + 1, 24 * 60 * 60) // 24 hours TTL
}

export async function POST(request: NextRequest) {
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

    let session = null

    // Handle auth failures gracefully
    try {
      session = await auth()
    } catch (authError) {
      console.warn(
        'Auth service unavailable, proceeding without session:',
        authError,
      )
      // Continue with session = null for anonymous rate limiting
    }

    const body = await request.json()
    const { adToken, fingerprintData } = body
    const userId = session?.user?.id

    // Process fingerprint data to get fingerprint hash
    const { fingerprint } = processFingerprintData(fingerprintData)

    // Validate ad token with enhanced security
    const adValidationResult = await validateAdToken(adToken, fingerprint || '')

    if (!adValidationResult.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ad token',
          message:
            adValidationResult.reason || 'The ad was not properly completed',
        },
        { status: 400 },
      )
    }

    // Check ad watching rate limits to prevent abuse
    const adRateLimitCheck = await checkAdRateLimit(userId, fingerprint)
    if (!adRateLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ad rate limit exceeded',
          message: adRateLimitCheck.message,
        },
        { status: 429 },
      )
    }

    // Grant +1 credit to user using the same rate limit system
    const creditResult = await grantUserCredit(session, fingerprintData)

    if (!creditResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to grant credit',
          message: creditResult.message,
        },
        { status: 500 },
      )
    }

    // Record ad watch to prevent abuse
    await recordAdWatch(userId, fingerprint)

    return NextResponse.json({
      success: true,
      message: 'Credit granted successfully! You can now send 1 more message.',
      remaining: creditResult.remaining,
      resetTime: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
    })
  } catch (error) {
    console.error('Error in rewarded ad grant credit:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while processing your request',
      },
      { status: 500 },
    )
  }
}

// Check ad watching rate limits
async function checkAdRateLimit(
  userId?: string,
  fingerprint?: string,
): Promise<{ allowed: boolean; message?: string }> {
  const ip = await getIPForCacheKey()

  // Create keys for different tracking methods
  const keys = cacheKeys.adLimit.getKeys(userId, fingerprint, ip)

  // Check hourly limit
  const hourlyCount = (await cache.get(keys.hourly)) as number | null
  if (hourlyCount && hourlyCount >= AD_RATE_LIMIT.MAX_ADS_PER_HOUR) {
    return {
      allowed: false,
      message: `You can only watch ${AD_RATE_LIMIT.MAX_ADS_PER_HOUR} ads per hour. Please try again later.`,
    }
  }

  // Check daily limit
  const dailyCount = (await cache.get(keys.daily)) as number | null
  if (dailyCount && dailyCount >= AD_RATE_LIMIT.MAX_ADS_PER_DAY) {
    return {
      allowed: false,
      message: `You've reached the daily limit of ${AD_RATE_LIMIT.MAX_ADS_PER_DAY} ads. Come back tomorrow!`,
    }
  }

  return { allowed: true }
}

// Record ad watch
async function recordAdWatch(
  userId?: string,
  fingerprint?: string,
): Promise<void> {
  const ip = await getIPForCacheKey()

  // Create keys for different tracking methods
  const keys = cacheKeys.adLimit.getKeys(userId, fingerprint, ip)

  try {
    // Increment counters
    const hourlyCount = ((await cache.get(keys.hourly)) as number) || 0
    const dailyCount = ((await cache.get(keys.daily)) as number) || 0

    await cache.set(
      keys.hourly,
      hourlyCount + 1,
      AD_RATE_LIMIT.RESET_TIME / 1000,
    )
    await cache.set(
      keys.daily,
      dailyCount + 1,
      AD_RATE_LIMIT.DAILY_RESET_TIME / 1000,
    )
  } catch (error) {
    console.warn('Failed to record ad watch in cache:', error)
    // Continue gracefully - the credit has already been granted
  }
}

// Grant user credit using bonus credits system instead of modifying rate limit
async function grantUserCredit(
  session: Session | null,
  fingerprintData?: string,
): Promise<{
  success: boolean
  message: string
  remaining?: number
}> {
  try {
    // Add a bonus credit
    await addBonusCredit(session)

    // Get current status to return consistent information
    const currentStatus = await checkRateLimit(session, fingerprintData)

    return {
      success: true,
      message: 'Credit granted successfully',
      remaining: currentStatus.remaining, // Already includes bonus credits
    }
  } catch (error) {
    console.error('🎯 [AD CREDIT] Error granting user credit:', error)
    return {
      success: false,
      message: 'Failed to grant credit due to internal error',
    }
  }
}
