import { headers } from 'next/headers'
import type { Session } from 'next-auth'

import { cache } from '@/lib/backend-cache'
import { RATE_LIMIT_CONFIG } from '@/lib/rate-limit-constants'

// Rate limit configurations
export const RATE_LIMITS = {
  IP_LIMIT: RATE_LIMIT_CONFIG.IP_LIMIT,
  USER_DAILY_LIMIT: RATE_LIMIT_CONFIG.USER_DAILY_LIMIT,
  IP_RESET_TIME: RATE_LIMIT_CONFIG.RESET_TIME_HOURS * 60 * 60 * 1000, // 24 hours in milliseconds
  USER_RESET_TIME: RATE_LIMIT_CONFIG.RESET_TIME_HOURS * 60 * 60 * 1000, // 24 hours in milliseconds
} as const

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  requiresAuth: boolean
  isLoggedIn: boolean
}

export interface RateLimitInfo {
  count: number
  resetTime: number
}

/**
 * Get client IP address from request headers
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers()

  // Check various headers for IP address
  const forwardedFor = headersList.get('x-forwarded-for')
  const realIP = headersList.get('x-real-ip')
  const cfConnectingIP = headersList.get('cf-connecting-ip')

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Fallback to a default value for development
  return '127.0.0.1'
}

/**
 * Generate cache key for IP-based rate limiting
 */
function getIPRateLimitKey(ip: string): string {
  return `rate_limit:ip:${ip}`
}

/**
 * Generate cache key for user-based rate limiting
 */
function getUserRateLimitKey(userId: string): string {
  return `rate_limit:user:${userId}`
}

/**
 * Get current rate limit info for an IP address
 */
async function getIPRateLimit(ip: string): Promise<RateLimitInfo> {
  const key = getIPRateLimitKey(ip)
  const cached = await cache.get<RateLimitInfo>(key)

  if (cached && cached.resetTime > Date.now()) {
    return cached
  }

  // If no cache or expired, return fresh state
  return {
    count: 0,
    resetTime: Date.now() + RATE_LIMITS.IP_RESET_TIME,
  }
}

/**
 * Get current rate limit info for a logged-in user
 */
async function getUserRateLimit(userId: string): Promise<RateLimitInfo> {
  const key = getUserRateLimitKey(userId)
  const cached = await cache.get<RateLimitInfo>(key)

  if (cached && cached.resetTime > Date.now()) {
    return cached
  }

  // If no cache or expired, return fresh state
  return {
    count: 0,
    resetTime: Date.now() + RATE_LIMITS.USER_RESET_TIME,
  }
}

/**
 * Update rate limit count for an IP address
 */
async function updateIPRateLimit(
  ip: string,
  info: RateLimitInfo,
): Promise<void> {
  const key = getIPRateLimitKey(ip)
  const ttl = info.resetTime - Date.now()

  if (ttl > 0) {
    await cache.set(key, info, ttl)
    console.info(
      `Updated IP rate limit for ${ip}: ${info.count}/${RATE_LIMITS.IP_LIMIT}`,
    )
  }
}

/**
 * Update rate limit count for a logged-in user
 */
async function updateUserRateLimit(
  userId: string,
  info: RateLimitInfo,
): Promise<void> {
  const key = getUserRateLimitKey(userId)
  const ttl = info.resetTime - Date.now()

  if (ttl > 0) {
    await cache.set(key, info, ttl)
    console.info(
      `Updated user rate limit for ${userId}: ${info.count}/${RATE_LIMITS.USER_DAILY_LIMIT}`,
    )
  }
}

/**
 * Check rate limit for the current request
 */
export async function checkRateLimit(
  session: Session | null,
): Promise<RateLimitResult> {
  const ip = await getClientIP()
  const isLoggedIn = !!session?.user?.id

  console.info(
    `Rate limit check for IP: ${ip}, logged in: ${isLoggedIn}, userId: ${session?.user?.id || 'none'}`,
  )

  // Enhanced logging to debug authentication issues
  if (session) {
    console.info('Session details:', {
      userId: session.user?.id,
      userEmail: session.user?.email,
      hasUser: !!session.user,
      hasUserId: !!session.user?.id,
    })

    // Critical debugging: if we have a session but no userId, this is a config issue
    if (session.user && !session.user.id) {
      console.error(
        'CRITICAL: Session exists but user.id is missing! Check NextAuth configuration.',
      )
    }
  }

  if (isLoggedIn && session?.user?.id) {
    // Handle logged-in users - completely ignore IP limits
    const userId = session.user.id
    const userInfo = await getUserRateLimit(userId)

    // Clear any IP-based rate limits for this IP when user is logged in
    // This prevents old anonymous usage from affecting logged-in users
    try {
      await resetIPRateLimit(ip)
      console.info(
        `Cleared IP rate limit for ${ip} (user ${userId} is logged in)`,
      )
    } catch (error) {
      console.error('Error clearing IP rate limit:', error)
    }

    const remaining = Math.max(0, RATE_LIMITS.USER_DAILY_LIMIT - userInfo.count)
    const allowed = userInfo.count < RATE_LIMITS.USER_DAILY_LIMIT

    console.info(
      `User ${userId} rate limit: ${userInfo.count}/${RATE_LIMITS.USER_DAILY_LIMIT}, remaining: ${remaining}`,
    )

    return {
      allowed,
      limit: RATE_LIMITS.USER_DAILY_LIMIT,
      remaining,
      resetTime: userInfo.resetTime,
      requiresAuth: false,
      isLoggedIn: true,
    }
  } else {
    // Handle unlogged users (IP-based)
    const ipInfo = await getIPRateLimit(ip)

    const remaining = Math.max(0, RATE_LIMITS.IP_LIMIT - ipInfo.count)
    const allowed = ipInfo.count < RATE_LIMITS.IP_LIMIT
    const requiresAuth = ipInfo.count >= RATE_LIMITS.IP_LIMIT

    console.info(
      `IP ${ip} rate limit: ${ipInfo.count}/${RATE_LIMITS.IP_LIMIT}, remaining: ${remaining}`,
    )

    return {
      allowed,
      limit: RATE_LIMITS.IP_LIMIT,
      remaining,
      resetTime: ipInfo.resetTime,
      requiresAuth,
      isLoggedIn: false,
    }
  }
}

/**
 * Consume/increment rate limit for the current request
 */
export async function consumeRateLimit(
  session: Session | null,
): Promise<RateLimitResult> {
  const ip = await getClientIP()
  const isLoggedIn = !!session?.user?.id

  console.info(
    `Consuming rate limit for IP: ${ip}, logged in: ${isLoggedIn}, userId: ${session?.user?.id || 'none'}`,
  )

  if (isLoggedIn && session?.user?.id) {
    // Handle logged-in users - completely ignore IP limits
    const userId = session.user.id

    // Clear any IP-based rate limits for this IP when user is logged in
    try {
      await resetIPRateLimit(ip)
      console.info(
        `Cleared IP rate limit for ${ip} during consumption (user ${userId} is logged in)`,
      )
    } catch (error) {
      console.error('Error clearing IP rate limit during consumption:', error)
    }

    const userInfo = await getUserRateLimit(userId)

    if (userInfo.count >= RATE_LIMITS.USER_DAILY_LIMIT) {
      // Already at limit, don't increment
      return {
        allowed: false,
        limit: RATE_LIMITS.USER_DAILY_LIMIT,
        remaining: 0,
        resetTime: userInfo.resetTime,
        requiresAuth: false,
        isLoggedIn: true,
      }
    }

    // Increment count
    const newInfo: RateLimitInfo = {
      count: userInfo.count + 1,
      resetTime: userInfo.resetTime,
    }

    await updateUserRateLimit(userId, newInfo)

    const remaining = Math.max(0, RATE_LIMITS.USER_DAILY_LIMIT - newInfo.count)

    console.info(
      `User ${userId} consumed rate limit: ${newInfo.count}/${RATE_LIMITS.USER_DAILY_LIMIT}`,
    )

    return {
      allowed: true,
      limit: RATE_LIMITS.USER_DAILY_LIMIT,
      remaining,
      resetTime: newInfo.resetTime,
      requiresAuth: false,
      isLoggedIn: true,
    }
  } else {
    // Handle unlogged users (IP-based)
    const ipInfo = await getIPRateLimit(ip)

    if (ipInfo.count >= RATE_LIMITS.IP_LIMIT) {
      // Already at limit, don't increment
      return {
        allowed: false,
        limit: RATE_LIMITS.IP_LIMIT,
        remaining: 0,
        resetTime: ipInfo.resetTime,
        requiresAuth: true,
        isLoggedIn: false,
      }
    }

    // Increment count
    const newInfo: RateLimitInfo = {
      count: ipInfo.count + 1,
      resetTime: ipInfo.resetTime,
    }

    await updateIPRateLimit(ip, newInfo)

    const remaining = Math.max(0, RATE_LIMITS.IP_LIMIT - newInfo.count)
    const requiresAuth = newInfo.count >= RATE_LIMITS.IP_LIMIT

    console.info(
      `IP ${ip} consumed rate limit: ${newInfo.count}/${RATE_LIMITS.IP_LIMIT}`,
    )

    return {
      allowed: true,
      limit: RATE_LIMITS.IP_LIMIT,
      remaining,
      resetTime: newInfo.resetTime,
      requiresAuth,
      isLoggedIn: false,
    }
  }
}

/**
 * Get rate limit status without consuming
 */
export async function getRateLimitStatus(
  session: Session | null,
): Promise<RateLimitResult> {
  return await checkRateLimit(session)
}

/**
 * Reset rate limit for a specific IP (admin function)
 */
export async function resetIPRateLimit(ip: string): Promise<void> {
  const key = getIPRateLimitKey(ip)
  await cache.delete(key)
  console.info(`Reset rate limit for IP: ${ip}`)
}

/**
 * Reset rate limit for a specific user (admin function)
 */
export async function resetUserRateLimit(userId: string): Promise<void> {
  const key = getUserRateLimitKey(userId)
  await cache.delete(key)
  console.info(`Reset rate limit for user: ${userId}`)
}

/**
 * Get all rate limit info for debugging (admin function)
 */
export async function getRateLimitDebugInfo(): Promise<{
  ipKeys: string[]
  userKeys: string[]
}> {
  const ipKeys = await cache.keys('rate_limit:ip:*')
  const userKeys = await cache.keys('rate_limit:user:*')

  return { ipKeys, userKeys }
}
