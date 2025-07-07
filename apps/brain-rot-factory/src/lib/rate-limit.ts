import { headers } from 'next/headers'
import type { Session } from 'next-auth'

import { cache } from '@/lib/backend-cache'
import {
  type FingerprintComponents,
  type FingerprintResult,
  processFingerprint,
} from '@/lib/browser-fingerprinting'
import { RATE_LIMIT_CONFIG } from '@/lib/rate-limit-constants'

// Rate limit configurations
export const RATE_LIMITS = {
  IP_LIMIT: RATE_LIMIT_CONFIG.IP_LIMIT,
  FINGERPRINT_LIMIT: RATE_LIMIT_CONFIG.IP_LIMIT * 2, // Slightly higher for fingerprint-based
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
 * Extract client IP from request headers
 */
async function getClientIP(): Promise<string> {
  const headersList = await headers()

  // Check multiple headers for the real IP (in order of preference)
  const forwardedFor = headersList.get('x-forwarded-for')
  const realIP = headersList.get('x-real-ip')
  const cfConnectingIP = headersList.get('cf-connecting-ip')

  // x-forwarded-for can contain multiple IPs, take the first one
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim())
    return ips[0]
  }

  if (realIP) {
    return realIP
  }

  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Fallback to a default (this should rarely happen in production)
  return '127.0.0.1'
}

/**
 * Generate cache keys for different rate limiting strategies
 */
function getRateLimitKeys(ip: string, fingerprint?: string) {
  const ipKey = `rate_limit:ip:${ip}`
  const fingerprintKey = fingerprint
    ? `rate_limit:fingerprint:${fingerprint}`
    : null
  const combinedKey = fingerprint
    ? `rate_limit:combined:${ip}:${fingerprint}`
    : ipKey

  return { ipKey, fingerprintKey, combinedKey }
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
 * Process fingerprint data from client with enhanced analysis
 */
function processFingerprintData(fingerprintData?: string): {
  fingerprint?: string
  confidence?: number
  fingerprintResult?: FingerprintResult
} {
  if (!fingerprintData) {
    return {}
  }

  try {
    const components: FingerprintComponents = JSON.parse(fingerprintData)
    const result: FingerprintResult = processFingerprint(components)

    return {
      fingerprint: result.fingerprint,
      confidence: result.confidence,
      fingerprintResult: result,
    }
  } catch (error) {
    console.warn('Failed to process fingerprint data:', error)
    return {}
  }
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
  const { ipKey, fingerprintKey, combinedKey } = getRateLimitKeys(
    ip,
    fingerprint,
  )

  let existingInfo: RateLimitInfo | null = null
  let method: 'ip' | 'fingerprint' | 'combined' = 'ip'

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
      confidence: adjustedConfidence,
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
    existingInfo.confidence = adjustedConfidence
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
  const { ipKey, fingerprintKey, combinedKey } = getRateLimitKeys(
    ip,
    fingerprint,
  )
  const ttl = info.resetTime - Date.now()

  if (ttl <= 0) return

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
 * Enhanced rate limit check with sophisticated unique user detection
 */
export async function checkRateLimit(
  session: Session | null,
  fingerprintData?: string,
): Promise<RateLimitResult> {
  const ip = await getClientIP()
  const isLoggedIn = !!session?.user?.id

  console.info(
    `Rate limit check for IP: ${ip}, logged in: ${isLoggedIn}, has fingerprint: ${!!fingerprintData}`,
  )

  if (isLoggedIn && session?.user?.id) {
    // Handle logged-in users with existing logic
    const userId = session.user.id
    const userKey = `rate_limit:user:${userId}`
    const userInfo = await cache.get<RateLimitInfo>(userKey)

    const info =
      userInfo && userInfo.resetTime > Date.now()
        ? userInfo
        : {
            count: 0,
            resetTime: Date.now() + RATE_LIMITS.RESET_TIME,
            lastSeen: Date.now(),
          }

    const remaining = Math.max(0, RATE_LIMITS.USER_DAILY_LIMIT - info.count)
    const allowed = info.count < RATE_LIMITS.USER_DAILY_LIMIT

    return {
      allowed,
      limit: RATE_LIMITS.USER_DAILY_LIMIT,
      remaining,
      resetTime: info.resetTime,
      requiresAuth: false,
      isLoggedIn: true,
      method: 'user',
    }
  }

  // Enhanced fingerprint processing for anonymous users
  const { fingerprint, confidence, fingerprintResult } =
    processFingerprintData(fingerprintData)
  const { info, method } = await getRateLimitInfo(
    ip,
    fingerprint,
    confidence,
    fingerprintResult,
  )

  const limit = getLimit(method)
  const remaining = Math.max(0, limit - info.count)
  const allowed = info.count < limit
  const requiresAuth = info.count >= limit

  console.info(
    `Anonymous user ${method} rate limit: ${info.count}/${limit}, remaining: ${remaining}, confidence: ${confidence || 'none'}, flags: ${info.suspiciousFlags?.length || 0}`,
  )

  return {
    allowed,
    limit,
    remaining,
    resetTime: info.resetTime,
    requiresAuth,
    isLoggedIn: false,
    method,
    confidence: info.confidence,
    fingerprint: fingerprint?.substring(0, 8), // Only return partial fingerprint for logging
    suspiciousFlags: info.suspiciousFlags,
  }
}

/**
 * Enhanced rate limit consumption with unique user tracking
 */
export async function consumeRateLimit(
  session: Session | null,
  fingerprintData?: string,
): Promise<RateLimitResult> {
  const ip = await getClientIP()
  const isLoggedIn = !!session?.user?.id

  console.info(`Consuming rate limit for IP: ${ip}, logged in: ${isLoggedIn}`)

  if (isLoggedIn && session?.user?.id) {
    // Handle logged-in users
    const userId = session.user.id
    const userKey = `rate_limit:user:${userId}`
    const userInfo = await cache.get<RateLimitInfo>(userKey)

    const info =
      userInfo && userInfo.resetTime > Date.now()
        ? userInfo
        : {
            count: 0,
            resetTime: Date.now() + RATE_LIMITS.RESET_TIME,
            lastSeen: Date.now(),
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
      await cache.set(userKey, newInfo, ttl)
    }

    const remaining = Math.max(0, RATE_LIMITS.USER_DAILY_LIMIT - newInfo.count)

    return {
      allowed: true,
      limit: RATE_LIMITS.USER_DAILY_LIMIT,
      remaining,
      resetTime: newInfo.resetTime,
      requiresAuth: false,
      isLoggedIn: true,
      method: 'user',
    }
  }

  // Enhanced handling of anonymous users with sophisticated fingerprinting
  const { fingerprint, confidence, fingerprintResult } =
    processFingerprintData(fingerprintData)
  const { info, method } = await getRateLimitInfo(
    ip,
    fingerprint,
    confidence,
    fingerprintResult,
  )

  const limit = getLimit(method)

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
        const key = `rate_limit:ip:${target}`
        await cache.delete(key)
        console.info(`Reset IP rate limit for: ${target}`)
      }
      break
    case 'user':
      {
        const key = `rate_limit:user:${target}`
        await cache.delete(key)
        console.info(`Reset user rate limit for: ${target}`)
      }
      break
    case 'fingerprint':
      {
        // Reset both fingerprint-only and combined keys for the fingerprint
        const fpKey = `rate_limit:fingerprint:${target}`
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
