import type { Session } from 'next-auth'

import { cache } from '@/lib/backend-cache'
import { type FingerprintResult } from '@/lib/browser-fingerprinting'
import { RATE_LIMIT_CONFIG } from '@/lib/rate-limit-constants'
import {
  type BurstLimitResult,
  checkBurstRateLimit,
} from '@/lib/utils/burst-rate-limit'
import { cacheKeys } from '@/lib/utils/cache-keys'
import { processFingerprintData } from '@/lib/utils/fingerprint'
import { getIPForCacheKey } from '@/lib/utils/ip'

// Rate limit configurations
export const RATE_LIMITS = {
  IP_LIMIT: RATE_LIMIT_CONFIG.IP_LIMIT,
  FINGERPRINT_LIMIT: RATE_LIMIT_CONFIG.IP_LIMIT, // Same as IP limit
  USER_DAILY_LIMIT: RATE_LIMIT_CONFIG.USER_DAILY_LIMIT,
  RESET_TIME: RATE_LIMIT_CONFIG.RESET_TIME_HOURS * 60 * 60 * 1000,
  // Enhanced unique user detection thresholds
  HIGH_CONFIDENCE_THRESHOLD: 0.8, // Very reliable fingerprint
  MEDIUM_CONFIDENCE_THRESHOLD: 0.5, // Moderately reliable fingerprint
  SUSPICIOUS_FLAGS_THRESHOLD: 2, // Max suspicious flags before reducing confidence
} as const

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  requiresAuth: boolean
  isLoggedIn: boolean
  method: 'ip' | 'fingerprint' | 'combined' | 'user'
  confidence?: number
  fingerprint?: string // Partial fingerprint for logging
  suspiciousFlags?: string[] // Security flags detected
  burstLimit?: BurstLimitResult // Burst rate limiting information
}

export interface RateLimitInfo {
  count: number
  resetTime: number
  lastSeen: number
  confidence?: number
  suspiciousFlags?: string[]
  fingerprintHistory?: string[] // Track fingerprint changes
}

/**
 * Generate cache keys for different rate limiting strategies
 */
function getRateLimitKeys(ip: string, fingerprint?: string) {
  return cacheKeys.rateLimit.getKeys(ip, fingerprint)
}

/**
 * Analyze suspicious behavior patterns to enhance unique user detection
 */
function analyzeSuspiciousBehavior(
  fingerprintResult?: FingerprintResult,
  existingInfo?: RateLimitInfo,
): {
  adjustedConfidence: number
  suspiciousFlags: string[]
} {
  let suspiciousFlags: string[] = []
  let confidenceAdjustment = 0

  if (fingerprintResult) {
    // Add suspicious flags from fingerprinting
    suspiciousFlags = [...fingerprintResult.suspiciousFlags]

    // Reduce confidence based on automation detection
    if (fingerprintResult.suspiciousFlags.includes('webdriver-detected')) {
      confidenceAdjustment -= 0.4
    }
    if (fingerprintResult.suspiciousFlags.includes('headless-browser')) {
      confidenceAdjustment -= 0.3
    }
    if (fingerprintResult.suspiciousFlags.includes('server-grade-hardware')) {
      confidenceAdjustment -= 0.2
    }
  }

  // Check for fingerprint switching (evasion attempt)
  if (existingInfo?.fingerprintHistory && fingerprintResult) {
    const currentFingerprint = fingerprintResult.fingerprint
    if (
      existingInfo.fingerprintHistory.length > 0 &&
      !existingInfo.fingerprintHistory.includes(currentFingerprint)
    ) {
      suspiciousFlags.push('fingerprint-switching')
      confidenceAdjustment -= 0.2
    }
  }

  // Check for rapid requests (automation indicator)
  if (existingInfo?.lastSeen) {
    const timeSinceLastRequest = Date.now() - existingInfo.lastSeen
    if (timeSinceLastRequest < 1000) {
      // Less than 1 second
      suspiciousFlags.push('rapid-requests')
      confidenceAdjustment -= 0.1
    }
  }

  const adjustedConfidence = Math.max(
    0,
    Math.min(1, (fingerprintResult?.confidence || 0) + confidenceAdjustment),
  )

  return { adjustedConfidence, suspiciousFlags }
}

/**
 * Enhanced rate limit info retrieval with sophisticated user detection
 */
async function getRateLimitInfo(
  ip: string,
  fingerprint?: string,
  confidence?: number,
  fingerprintResult?: FingerprintResult,
): Promise<{
  info: RateLimitInfo
  method: 'ip' | 'fingerprint' | 'combined'
}> {
  const {
    ip: ipKey,
    fingerprint: fingerprintKey,
    combined: combinedKey,
  } = getRateLimitKeys(ip, fingerprint)

  let existingInfo: RateLimitInfo | null = null
  let method: 'ip' | 'fingerprint' | 'combined' = 'ip'

  try {
    // Strategy selection based on fingerprint confidence
    if (
      fingerprint &&
      confidence &&
      confidence > RATE_LIMITS.HIGH_CONFIDENCE_THRESHOLD
    ) {
      // High confidence - use combined approach for maximum uniqueness
      existingInfo = await cache.get<RateLimitInfo>(combinedKey)
      if (existingInfo && existingInfo.resetTime > Date.now()) {
        method = 'combined'
      } else {
        // Check fingerprint-only as fallback
        existingInfo = await cache.get<RateLimitInfo>(fingerprintKey!)
        if (existingInfo && existingInfo.resetTime > Date.now()) {
          method = 'fingerprint'
        }
      }
    } else if (
      fingerprint &&
      confidence &&
      confidence > RATE_LIMITS.MEDIUM_CONFIDENCE_THRESHOLD
    ) {
      // Medium confidence - use fingerprint-only
      existingInfo = await cache.get<RateLimitInfo>(fingerprintKey!)
      if (existingInfo && existingInfo.resetTime > Date.now()) {
        method = 'fingerprint'
      }
    }

    // Fallback to IP-based if no fingerprint method worked
    if (!existingInfo || existingInfo.resetTime <= Date.now()) {
      existingInfo = await cache.get<RateLimitInfo>(ipKey)
      if (existingInfo && existingInfo.resetTime > Date.now()) {
        method = 'ip'
      }
    }
  } catch (error) {
    console.warn('Cache error during rate limit check:', error)
    // Fallback to default behavior on cache errors
    existingInfo = null
    method = 'ip'
  }

  // Analyze suspicious behavior and adjust confidence
  const { adjustedConfidence, suspiciousFlags } = analyzeSuspiciousBehavior(
    fingerprintResult,
    existingInfo,
  )

  // Create fresh info if no valid existing info
  if (!existingInfo || existingInfo.resetTime <= Date.now()) {
    existingInfo = {
      count: 0,
      resetTime: Date.now() + RATE_LIMITS.RESET_TIME,
      lastSeen: Date.now(),
      ...(fingerprintResult && { confidence: adjustedConfidence }),
      suspiciousFlags,
      fingerprintHistory: fingerprint ? [fingerprint] : [],
    }

    // Adjust method based on adjusted confidence
    if (
      fingerprint &&
      adjustedConfidence > RATE_LIMITS.HIGH_CONFIDENCE_THRESHOLD
    ) {
      method = 'combined'
    } else if (
      fingerprint &&
      adjustedConfidence > RATE_LIMITS.MEDIUM_CONFIDENCE_THRESHOLD
    ) {
      method = 'fingerprint'
    } else {
      method = 'ip'
    }
  } else {
    // Update existing info with new analysis
    if (fingerprintResult) {
      existingInfo.confidence = adjustedConfidence
    }
    existingInfo.suspiciousFlags = suspiciousFlags

    // Update fingerprint history
    if (fingerprint && existingInfo.fingerprintHistory) {
      if (!existingInfo.fingerprintHistory.includes(fingerprint)) {
        existingInfo.fingerprintHistory = [
          ...existingInfo.fingerprintHistory.slice(-4), // Keep last 4 fingerprints
          fingerprint,
        ]
      }
    }
  }

  return { info: existingInfo, method }
}

/**
 * Update rate limit based on the method used with enhanced tracking
 */
async function updateRateLimitInfo(
  ip: string,
  fingerprint: string | undefined,
  info: RateLimitInfo,
  method: 'ip' | 'fingerprint' | 'combined',
): Promise<void> {
  const {
    ip: ipKey,
    fingerprint: fingerprintKey,
    combined: combinedKey,
  } = getRateLimitKeys(ip, fingerprint)
  const ttl = info.resetTime - Date.now()

  if (ttl <= 0) return

  try {
    // Update based on method
    switch (method) {
      case 'combined':
        if (fingerprint) {
          await cache.set(combinedKey, info, ttl)
          // Also update fingerprint-only for fallback
          await cache.set(fingerprintKey!, info, ttl)
        }
        break
      case 'fingerprint':
        if (fingerprint && fingerprintKey) {
          await cache.set(fingerprintKey, info, ttl)
        }
        break
      case 'ip':
      default:
        await cache.set(ipKey, info, ttl)
        break
    }

    // Enhanced logging with security information
    const logDetails = {
      method,
      count: info.count,
      limit: getLimit(method),
      confidence: info.confidence,
      suspiciousFlags: info.suspiciousFlags?.length || 0,
      identifier: method === 'ip' ? ip : fingerprint?.substring(0, 8),
    }

    console.info('Rate limit updated:', logDetails)
  } catch (error) {
    console.warn('Failed to update rate limit info in cache:', error)
    // Continue gracefully - the rate limit check will still work with fallback behavior
  }

  // Log security alerts for highly suspicious activity
  if (
    info.suspiciousFlags &&
    info.suspiciousFlags.length >= RATE_LIMITS.SUSPICIOUS_FLAGS_THRESHOLD
  ) {
    console.warn('High suspicious activity detected:', {
      ip,
      fingerprint: fingerprint?.substring(0, 8),
      flags: info.suspiciousFlags,
      method,
    })
  }
}

/**
 * Get the appropriate limit based on detection method and confidence
 */
function getLimit(method: 'ip' | 'fingerprint' | 'combined' | 'user'): number {
  switch (method) {
    case 'user':
      return RATE_LIMITS.USER_DAILY_LIMIT
    case 'combined':
    case 'fingerprint':
      return RATE_LIMITS.FINGERPRINT_LIMIT
    case 'ip':
    default:
      return RATE_LIMITS.IP_LIMIT
  }
}

/**
 * Get bonus credits for rate limit calculation
 */
async function getBonusCreditsForRateLimit(
  session: Session | null,
  ip: string,
): Promise<number> {
  const userId = session?.user?.id
  const key = cacheKeys.bonusCredits.getKey(userId, ip)

  return (await cache.get<number>(key)) || 0
}

/**
 * Consume bonus credits first, then regular credits
 */
async function consumeBonusCredits(
  session: Session | null,
  ip: string,
): Promise<boolean> {
  const userId = session?.user?.id
  const key = cacheKeys.bonusCredits.getKey(userId, ip)

  const current = (await cache.get<number>(key)) || 0
  if (current > 0) {
    const newTotal = current - 1
    if (newTotal > 0) {
      await cache.set(key, newTotal, 24 * 60 * 60)
    } else {
      await cache.delete(key)
    }
    return true // Successfully consumed bonus credit
  }
  return false // No bonus credits available
}

/**
 * Enhanced rate limit check with sophisticated unique user detection
 */
export async function checkRateLimit(
  session: Session | null,
  fingerprintData?: string,
): Promise<RateLimitResult> {
  try {
    const ip = await getIPForCacheKey()
    const isLoggedIn = !!session?.user?.id

    console.info(
      `Rate limit check for IP: ${ip}, logged in: ${isLoggedIn}, has fingerprint: ${!!fingerprintData}`,
    )

    if (isLoggedIn && session?.user?.id) {
      // Handle logged-in users with existing logic
      const userId = session.user.id
      const userKey = cacheKeys.rateLimit.user(userId)

      try {
        const userInfo = await cache.get<RateLimitInfo>(userKey)

        const info =
          userInfo && userInfo.resetTime > Date.now()
            ? userInfo
            : {
                count: 0,
                resetTime: Date.now() + RATE_LIMITS.RESET_TIME,
                lastSeen: Date.now(),
              }

        const baseRemaining = Math.max(
          0,
          RATE_LIMITS.USER_DAILY_LIMIT - info.count,
        )
        const bonusCredits = await getBonusCreditsForRateLimit(session, ip)
        const remaining = baseRemaining + bonusCredits
        const allowed =
          info.count < RATE_LIMITS.USER_DAILY_LIMIT || bonusCredits > 0

        // Check burst rate limiting for logged-in users
        let burstResult: BurstLimitResult | undefined
        try {
          burstResult = await checkBurstRateLimit(userId, 'user')

          if (!burstResult.allowed) {
            console.warn(`[BURST LIMIT] Request blocked for user ${userId}:`, {
              burstLevel: burstResult.burstLevel,
              windowsViolated: burstResult.windowsViolated,
              nextAllowedTime: burstResult.nextAllowedTime,
              requestsInWindows: burstResult.requestsInWindows,
            })
          } else if (burstResult.suspiciousActivity) {
            console.warn(
              `[BURST LIMIT] Suspicious activity detected for user ${userId}:`,
              {
                burstLevel: burstResult.burstLevel,
                requestsInWindows: burstResult.requestsInWindows,
              },
            )
          }
        } catch (burstError) {
          console.warn('Error in burst rate limit check for user:', burstError)
          burstResult = undefined
        }

        // Final decision: both regular and burst limits must allow the request
        const finalAllowed = allowed && burstResult?.allowed !== false

        return {
          allowed: finalAllowed,
          limit: RATE_LIMITS.USER_DAILY_LIMIT,
          remaining,
          resetTime: info.resetTime,
          requiresAuth: false,
          isLoggedIn: true,
          method: 'user',
          burstLimit: burstResult,
        }
      } catch (cacheError) {
        console.warn('Cache error for user rate limit:', cacheError)
        // Fallback to allowing the request for logged-in users on cache errors
        return {
          allowed: true,
          limit: RATE_LIMITS.USER_DAILY_LIMIT,
          remaining: RATE_LIMITS.USER_DAILY_LIMIT,
          resetTime: Date.now() + RATE_LIMITS.RESET_TIME,
          requiresAuth: false,
          isLoggedIn: true,
          method: 'user',
          burstLimit: undefined, // No burst checking on cache error
        }
      }
    }

    // Enhanced fingerprint processing for anonymous users
    const { fingerprint, confidence, fingerprintResult } =
      processFingerprintData(fingerprintData)

    console.info(
      '🔍 [RATE LIMIT] Checking limits - fingerprint:',
      fingerprint?.substring(0, 8),
      'confidence:',
      confidence,
    )

    const { info, method } = await getRateLimitInfo(
      ip,
      fingerprint,
      confidence,
      fingerprintResult,
    )

    console.info(
      '🔍 [RATE LIMIT] Got info - method:',
      method,
      'count:',
      info.count,
      'resetTime:',
      new Date(info.resetTime),
    )

    const limit = getLimit(method)
    const baseRemaining = Math.max(0, limit - info.count)
    const bonusCredits = await getBonusCreditsForRateLimit(session, ip)
    const remaining = baseRemaining + bonusCredits
    const allowed = info.count < limit || bonusCredits > 0
    const requiresAuth = info.count >= limit && bonusCredits === 0

    console.info(
      `Anonymous user ${method} rate limit: ${info.count}/${limit}, remaining: ${remaining}, confidence: ${confidence || 'none'}, flags: ${info.suspiciousFlags?.length || 0}`,
    )

    // Check burst rate limiting
    let burstResult: BurstLimitResult | undefined
    try {
      // Create identifier based on method for burst checking
      let burstIdentifier: string

      switch (method) {
        case 'combined':
          burstIdentifier = fingerprint ? `${ip}:${fingerprint}` : ip
          break
        case 'fingerprint':
          burstIdentifier = fingerprint || ip
          break
        default:
          burstIdentifier = ip
      }

      burstResult = await checkBurstRateLimit(burstIdentifier, method)

      // Log burst detection
      if (!burstResult.allowed) {
        console.warn(
          `[BURST LIMIT] Request blocked for ${burstIdentifier} (${method}):`,
          {
            burstLevel: burstResult.burstLevel,
            windowsViolated: burstResult.windowsViolated,
            nextAllowedTime: burstResult.nextAllowedTime,
            requestsInWindows: burstResult.requestsInWindows,
          },
        )
      } else if (burstResult.suspiciousActivity) {
        console.warn(
          `[BURST LIMIT] Suspicious activity detected for ${burstIdentifier} (${method}):`,
          {
            burstLevel: burstResult.burstLevel,
            requestsInWindows: burstResult.requestsInWindows,
          },
        )
      }
    } catch (burstError) {
      console.warn('Error in burst rate limit check:', burstError)
      // Don't block request on burst check errors
      burstResult = undefined
    }

    // Final decision: both regular and burst limits must allow the request
    const finalAllowed = allowed && burstResult?.allowed !== false

    return {
      allowed: finalAllowed,
      limit,
      remaining,
      resetTime: info.resetTime,
      requiresAuth,
      isLoggedIn: false,
      method,
      ...(info.confidence !== undefined && { confidence: info.confidence }),
      fingerprint: fingerprint?.substring(0, 8), // Only return partial fingerprint for logging
      suspiciousFlags: info.suspiciousFlags,
      burstLimit: burstResult,
    }
  } catch (error) {
    console.warn('Error in checkRateLimit:', error)
    // Fallback to allowing the request on general errors
    return {
      allowed: true,
      limit: RATE_LIMITS.IP_LIMIT,
      remaining: RATE_LIMITS.IP_LIMIT,
      resetTime: Date.now() + RATE_LIMITS.RESET_TIME,
      requiresAuth: false,
      isLoggedIn: false,
      method: 'ip',
      burstLimit: undefined, // No burst checking on general error
    }
  }
}

// Simple mutex implementation for atomic operations
const lockMap = new Map<string, Promise<void>>()

async function withLock<T>(
  key: string,
  operation: () => Promise<T>,
): Promise<T> {
  // Wait for any existing lock on this key
  while (lockMap.has(key)) {
    await lockMap.get(key)
  }

  // Create a new lock
  let releaseLock: () => void
  const lock = new Promise<void>((resolve) => {
    releaseLock = resolve
  })

  lockMap.set(key, lock)

  try {
    const result = await operation()
    return result
  } finally {
    // Release the lock
    lockMap.delete(key)
    releaseLock!()
  }
}

/**
 * Enhanced rate limit consumption with unique user tracking and atomic operations
 */
export async function consumeRateLimit(
  session: Session | null,
  fingerprintData?: string,
): Promise<RateLimitResult> {
  const ip = await getIPForCacheKey()
  const isLoggedIn = !!session?.user?.id

  console.info(`Consuming rate limit for IP: ${ip}, logged in: ${isLoggedIn}`)

  if (isLoggedIn && session?.user?.id) {
    // Handle logged-in users with atomic operations
    const userId = session.user.id
    const userKey = cacheKeys.rateLimit.user(userId)

    return await withLock(userKey, async () => {
      const userInfo = await cache.get<RateLimitInfo>(userKey)

      const info =
        userInfo && userInfo.resetTime > Date.now()
          ? userInfo
          : {
              count: 0,
              resetTime: Date.now() + RATE_LIMITS.RESET_TIME,
              lastSeen: Date.now(),
            }

      // Try to consume bonus credits first
      const bonusCreditsUsed = await consumeBonusCredits(session, ip)
      if (bonusCreditsUsed) {
        // Successfully used bonus credit, don't increment regular count
        const bonusCredits = await getBonusCreditsForRateLimit(session, ip)
        const remaining =
          Math.max(0, RATE_LIMITS.USER_DAILY_LIMIT - info.count) + bonusCredits

        return {
          allowed: true,
          limit: RATE_LIMITS.USER_DAILY_LIMIT,
          remaining,
          resetTime: info.resetTime,
          requiresAuth: false,
          isLoggedIn: true,
          method: 'user',
        }
      }

      if (info.count >= RATE_LIMITS.USER_DAILY_LIMIT) {
        return {
          allowed: false,
          limit: RATE_LIMITS.USER_DAILY_LIMIT,
          remaining: 0,
          resetTime: info.resetTime,
          requiresAuth: false,
          isLoggedIn: true,
          method: 'user',
        }
      }

      // Increment and save
      const newInfo: RateLimitInfo = {
        ...info,
        count: info.count + 1,
        lastSeen: Date.now(),
      }

      const ttl = newInfo.resetTime - Date.now()
      if (ttl > 0) {
        try {
          await cache.set(userKey, newInfo, ttl)
        } catch (error) {
          console.warn('Failed to update user rate limit info in cache:', error)
          // Continue gracefully - the rate limit check will still work
        }
      }

      const remaining = Math.max(
        0,
        RATE_LIMITS.USER_DAILY_LIMIT - newInfo.count,
      )

      return {
        allowed: true,
        limit: RATE_LIMITS.USER_DAILY_LIMIT,
        remaining,
        resetTime: newInfo.resetTime,
        requiresAuth: false,
        isLoggedIn: true,
        method: 'user',
      }
    })
  }

  // Enhanced handling of anonymous users with atomic operations
  const { fingerprint, confidence, fingerprintResult } =
    processFingerprintData(fingerprintData)

  // Create a lock key based on the method that will be used
  const tempMethod =
    fingerprint &&
    confidence &&
    confidence > RATE_LIMITS.HIGH_CONFIDENCE_THRESHOLD
      ? 'combined'
      : fingerprint &&
          confidence &&
          confidence > RATE_LIMITS.MEDIUM_CONFIDENCE_THRESHOLD
        ? 'fingerprint'
        : 'ip'

  const lockKey =
    tempMethod === 'combined' && fingerprint
      ? cacheKeys.rateLimit.combined(ip, fingerprint)
      : tempMethod === 'fingerprint' && fingerprint
        ? cacheKeys.rateLimit.fingerprint(fingerprint)
        : cacheKeys.rateLimit.ip(ip)

  return await withLock(lockKey, async () => {
    const { info, method } = await getRateLimitInfo(
      ip,
      fingerprint,
      confidence,
      fingerprintResult,
    )

    const limit = getLimit(method)

    // Try to consume bonus credits first for anonymous users
    const bonusCreditsUsed = await consumeBonusCredits(session, ip)
    if (bonusCreditsUsed) {
      // Successfully used bonus credit, don't increment regular count
      const bonusCredits = await getBonusCreditsForRateLimit(session, ip)
      const remaining = Math.max(0, limit - info.count) + bonusCredits

      return {
        allowed: true,
        limit,
        remaining,
        resetTime: info.resetTime,
        requiresAuth: false,
        isLoggedIn: false,
        method,
        confidence: info.confidence,
        fingerprint: fingerprint?.substring(0, 8),
        suspiciousFlags: info.suspiciousFlags,
      }
    }

    if (info.count >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetTime: info.resetTime,
        requiresAuth: true,
        isLoggedIn: false,
        method,
        confidence: info.confidence,
        fingerprint: fingerprint?.substring(0, 8),
        suspiciousFlags: info.suspiciousFlags,
      }
    }

    // Increment and save with enhanced tracking
    const newInfo: RateLimitInfo = {
      ...info,
      count: info.count + 1,
      lastSeen: Date.now(),
    }

    await updateRateLimitInfo(ip, fingerprint, newInfo, method)

    const remaining = Math.max(0, limit - newInfo.count)
    const requiresAuth = newInfo.count >= limit

    return {
      allowed: true,
      limit,
      remaining,
      resetTime: newInfo.resetTime,
      requiresAuth,
      isLoggedIn: false,
      method,
      confidence: newInfo.confidence,
      fingerprint: fingerprint?.substring(0, 8),
      suspiciousFlags: newInfo.suspiciousFlags,
    }
  })
}

/**
 * Get rate limit status
 */
export async function getRateLimitStatus(
  session: Session | null,
  fingerprintData?: string,
): Promise<RateLimitResult> {
  return checkRateLimit(session, fingerprintData)
}

/**
 * Get rate limit debug information (admin only)
 */
export async function getRateLimitDebugInfo(): Promise<{
  ipKeys: string[]
  userKeys: string[]
  fingerprintKeys: string[]
}> {
  // Get all keys from cache that match our patterns
  const allKeys = await cache.keys('rate_limit:*')

  const ipKeys = allKeys.filter((key) => key.includes(':ip:'))
  const userKeys = allKeys.filter((key) => key.includes(':user:'))
  const fingerprintKeys = allKeys.filter(
    (key) => key.includes(':fingerprint:') || key.includes(':combined:'),
  )

  return {
    ipKeys,
    userKeys,
    fingerprintKeys,
  }
}

/**
 * Reset rate limit for various types
 */
export async function resetRateLimit(
  target: string,
  type: 'ip' | 'user' | 'fingerprint',
): Promise<void> {
  switch (type) {
    case 'ip':
      {
        const key = cacheKeys.rateLimit.ip(target)
        await cache.delete(key)
        console.info(`Reset IP rate limit for: ${target}`)
      }
      break
    case 'user':
      {
        const key = cacheKeys.rateLimit.user(target)
        await cache.delete(key)
        console.info(`Reset user rate limit for: ${target}`)
      }
      break
    case 'fingerprint':
      {
        // Reset both fingerprint-only and combined keys for the fingerprint
        const fpKey = cacheKeys.rateLimit.fingerprint(target)
        const combinedKeys = await cache.keys(`rate_limit:combined:*:${target}`)

        await cache.delete(fpKey)
        for (const key of combinedKeys) {
          await cache.delete(key)
        }
        console.info(`Reset fingerprint rate limit for: ${target}`)
      }
      break
  }
}
