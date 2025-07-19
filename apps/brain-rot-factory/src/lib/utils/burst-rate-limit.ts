/**
 * Burst Rate Limiting System
 *
 * Implements sliding window rate limiting to prevent burst attacks
 * and rapid successive requests that could overwhelm the system.
 *
 * Features:
 * - Sliding window algorithm for accurate burst detection
 * - Configurable burst thresholds and time windows
 * - Integration with existing rate limiting system
 * - Automatic recovery mechanisms
 * - Security event logging
 */

import { cache } from '@/lib/backend-cache'
import { cacheKeys } from '@/lib/utils/cache-keys'

// Burst rate limiting configurations
export const BURST_LIMITS = {
  // Short-term burst protection (10 seconds)
  SHORT_WINDOW: {
    duration: 10 * 1000, // 10 seconds
    maxRequests: 5, // Max 5 requests in 10 seconds
  },
  // Medium-term burst protection (1 minute)
  MEDIUM_WINDOW: {
    duration: 60 * 1000, // 1 minute
    maxRequests: 15, // Max 15 requests in 1 minute
  },
  // Long-term burst protection (5 minutes)
  LONG_WINDOW: {
    duration: 5 * 60 * 1000, // 5 minutes
    maxRequests: 40, // Max 40 requests in 5 minutes
  },
  // Clean-up interval for expired timestamps
  CLEANUP_INTERVAL: 60 * 1000, // Clean up every minute
} as const

export interface BurstLimitResult {
  allowed: boolean
  burstLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
  windowsViolated: Array<'short' | 'medium' | 'long'>
  nextAllowedTime?: number
  requestsInWindows: {
    short: number
    medium: number
    long: number
  }
  suspiciousActivity: boolean
}

export interface BurstTrackingData {
  timestamps: number[]
  lastCleanup: number
  suspiciousFlags: string[]
  consecutiveViolations: number
}

/**
 * Clean up expired timestamps from tracking data
 */
function cleanupExpiredTimestamps(
  data: BurstTrackingData,
  currentTime: number,
): BurstTrackingData {
  const oldestRelevantTime = currentTime - BURST_LIMITS.LONG_WINDOW.duration

  const cleanedData = {
    ...data,
    timestamps: data.timestamps.filter((ts) => ts > oldestRelevantTime),
    lastCleanup: currentTime,
  }

  // Reset consecutive violations if enough time has passed
  if (
    data.timestamps.length === 0 ||
    currentTime - Math.max(...data.timestamps) >
      BURST_LIMITS.MEDIUM_WINDOW.duration
  ) {
    cleanedData.consecutiveViolations = 0
    cleanedData.suspiciousFlags = []
  }

  return cleanedData
}

/**
 * Count requests within a specific time window
 */
function countRequestsInWindow(
  timestamps: number[],
  windowDuration: number,
  currentTime: number,
): number {
  const windowStart = currentTime - windowDuration
  return timestamps.filter((ts) => ts > windowStart).length
}

/**
 * Analyze burst patterns to detect suspicious activity
 */
function analyzeBurstPatterns(
  data: BurstTrackingData,
  currentTime: number,
): {
  suspiciousActivity: boolean
  burstLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
  newFlags: string[]
} {
  const recentTimestamps = data.timestamps.filter(
    (ts) => ts > currentTime - BURST_LIMITS.LONG_WINDOW.duration,
  )

  let suspiciousActivity = false
  let burstLevel: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none'
  const newFlags: string[] = []

  // Check for very rapid requests (< 500ms apart)
  const rapidRequests = recentTimestamps.filter((ts, index) => {
    if (index === 0) return false
    return ts - recentTimestamps[index - 1] < 500
  })

  if (rapidRequests.length > 0) {
    newFlags.push('rapid-succession-requests')
    suspiciousActivity = true
    burstLevel = 'medium'
  }

  // Check for consistent high-frequency bursts
  if (data.consecutiveViolations > 3) {
    newFlags.push('persistent-burst-attempts')
    suspiciousActivity = true
    burstLevel = 'high'
  }

  // Check for extreme burst patterns
  const veryRecentRequests = countRequestsInWindow(
    recentTimestamps,
    5000, // 5 seconds
    currentTime,
  )

  if (veryRecentRequests > 8) {
    newFlags.push('extreme-burst-pattern')
    suspiciousActivity = true
    burstLevel = 'critical'
  }

  // Check for automated patterns (very regular intervals)
  if (recentTimestamps.length >= 3) {
    const intervals = []
    for (let i = 1; i < recentTimestamps.length; i++) {
      intervals.push(recentTimestamps[i] - recentTimestamps[i - 1])
    }

    // Check if intervals are suspiciously regular (variance < 100ms)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const variance =
      intervals.reduce(
        (acc, interval) => acc + Math.pow(interval - avgInterval, 2),
        0,
      ) / intervals.length

    if (variance < 10000) {
      // Variance < 100ms^2
      newFlags.push('automated-regular-intervals')
      suspiciousActivity = true
      if (burstLevel === 'none') burstLevel = 'low'
    }
  }

  return { suspiciousActivity, burstLevel, newFlags }
}

/**
 * Calculate when the next request would be allowed
 */
function calculateNextAllowedTime(
  timestamps: number[],
  currentTime: number,
): number | undefined {
  // Find the earliest window that would allow a request
  const windows = [
    {
      duration: BURST_LIMITS.SHORT_WINDOW.duration,
      max: BURST_LIMITS.SHORT_WINDOW.maxRequests,
    },
    {
      duration: BURST_LIMITS.MEDIUM_WINDOW.duration,
      max: BURST_LIMITS.MEDIUM_WINDOW.maxRequests,
    },
    {
      duration: BURST_LIMITS.LONG_WINDOW.duration,
      max: BURST_LIMITS.LONG_WINDOW.maxRequests,
    },
  ]

  let earliestAllowedTime: number | undefined

  for (const window of windows) {
    const requestsInWindow = countRequestsInWindow(
      timestamps,
      window.duration,
      currentTime,
    )

    if (requestsInWindow >= window.max) {
      // Find when the oldest request in this window will expire
      const windowStart = currentTime - window.duration
      const requestsInWindowSorted = timestamps
        .filter((ts) => ts > windowStart)
        .sort((a, b) => a - b)

      if (requestsInWindowSorted.length >= window.max) {
        const oldestRequestTime =
          requestsInWindowSorted[requestsInWindowSorted.length - window.max]
        const nextAllowedForThisWindow = oldestRequestTime + window.duration + 1

        if (
          !earliestAllowedTime ||
          nextAllowedForThisWindow > earliestAllowedTime
        ) {
          earliestAllowedTime = nextAllowedForThisWindow
        }
      }
    }
  }

  return earliestAllowedTime
}

/**
 * Check if a request should be allowed based on burst rate limiting
 */
export async function checkBurstRateLimit(
  identifier: string,
  method: 'ip' | 'fingerprint' | 'combined' | 'user' = 'ip',
): Promise<BurstLimitResult> {
  const currentTime = Date.now()
  const burstKey = cacheKeys.rateLimit.burst(identifier, method)

  try {
    // Get existing burst tracking data
    let data = await cache.get<BurstTrackingData>(burstKey)

    if (!data) {
      data = {
        timestamps: [],
        lastCleanup: currentTime,
        suspiciousFlags: [],
        consecutiveViolations: 0,
      }
    }

    // Clean up expired timestamps if needed
    if (currentTime - data.lastCleanup > BURST_LIMITS.CLEANUP_INTERVAL) {
      data = cleanupExpiredTimestamps(data, currentTime)
    }

    // Count requests in each window
    const requestsInWindows = {
      short: countRequestsInWindow(
        data.timestamps,
        BURST_LIMITS.SHORT_WINDOW.duration,
        currentTime,
      ),
      medium: countRequestsInWindow(
        data.timestamps,
        BURST_LIMITS.MEDIUM_WINDOW.duration,
        currentTime,
      ),
      long: countRequestsInWindow(
        data.timestamps,
        BURST_LIMITS.LONG_WINDOW.duration,
        currentTime,
      ),
    }

    // Check which windows would be violated
    const windowsViolated: Array<'short' | 'medium' | 'long'> = []

    if (requestsInWindows.short >= BURST_LIMITS.SHORT_WINDOW.maxRequests) {
      windowsViolated.push('short')
    }
    if (requestsInWindows.medium >= BURST_LIMITS.MEDIUM_WINDOW.maxRequests) {
      windowsViolated.push('medium')
    }
    if (requestsInWindows.long >= BURST_LIMITS.LONG_WINDOW.maxRequests) {
      windowsViolated.push('long')
    }

    const allowed = windowsViolated.length === 0

    // Analyze burst patterns
    const { suspiciousActivity, burstLevel, newFlags } = analyzeBurstPatterns(
      data,
      currentTime,
    )

    // Calculate next allowed time if request is blocked
    const nextAllowedTime = allowed
      ? undefined
      : calculateNextAllowedTime(data.timestamps, currentTime)

    // Update tracking data if request would be allowed
    if (allowed) {
      data.timestamps.push(currentTime)
      data.consecutiveViolations = 0
    } else {
      data.consecutiveViolations += 1
    }

    // Add new suspicious flags
    if (newFlags.length > 0) {
      data.suspiciousFlags = [
        ...new Set([...data.suspiciousFlags, ...newFlags]),
      ]
    }

    // Store updated data with appropriate TTL
    const ttl =
      BURST_LIMITS.LONG_WINDOW.duration + BURST_LIMITS.CLEANUP_INTERVAL
    await cache.set(burstKey, data, ttl)

    // Log security events for suspicious activity
    if (suspiciousActivity || windowsViolated.length > 0) {
      console.warn(
        `[BURST LIMIT] Suspicious activity detected for ${identifier}:`,
        {
          method,
          burstLevel,
          windowsViolated,
          suspiciousFlags: data.suspiciousFlags,
          consecutiveViolations: data.consecutiveViolations,
          requestsInWindows,
        },
      )
    }

    return {
      allowed,
      burstLevel,
      windowsViolated,
      nextAllowedTime,
      requestsInWindows,
      suspiciousActivity,
    }
  } catch (error) {
    console.error('Error in burst rate limit check:', error)

    // On error, allow the request but log the issue
    return {
      allowed: true,
      burstLevel: 'none',
      windowsViolated: [],
      requestsInWindows: { short: 0, medium: 0, long: 0 },
      suspiciousActivity: false,
    }
  }
}

/**
 * Reset burst rate limiting data for an identifier
 * Useful for emergency situations or manual interventions
 */
export async function resetBurstRateLimit(
  identifier: string,
  method: 'ip' | 'fingerprint' | 'combined' | 'user' = 'ip',
): Promise<boolean> {
  try {
    const burstKey = cacheKeys.rateLimit.burst(identifier, method)
    await cache.delete(burstKey)

    console.info(
      `[BURST LIMIT] Reset burst rate limit for ${identifier} (${method})`,
    )
    return true
  } catch (error) {
    console.error('Error resetting burst rate limit:', error)
    return false
  }
}

/**
 * Get burst rate limiting status without checking/updating
 * Useful for monitoring and diagnostics
 */
export async function getBurstRateLimitStatus(
  identifier: string,
  method: 'ip' | 'fingerprint' | 'combined' | 'user' = 'ip',
): Promise<{
  data: BurstTrackingData | null
  requestsInWindows: {
    short: number
    medium: number
    long: number
  }
  wouldBeAllowed: boolean
}> {
  try {
    const burstKey = cacheKeys.rateLimit.burst(identifier, method)
    const data = await cache.get<BurstTrackingData>(burstKey)

    if (!data) {
      return {
        data: null,
        requestsInWindows: { short: 0, medium: 0, long: 0 },
        wouldBeAllowed: true,
      }
    }

    const currentTime = Date.now()
    const requestsInWindows = {
      short: countRequestsInWindow(
        data.timestamps,
        BURST_LIMITS.SHORT_WINDOW.duration,
        currentTime,
      ),
      medium: countRequestsInWindow(
        data.timestamps,
        BURST_LIMITS.MEDIUM_WINDOW.duration,
        currentTime,
      ),
      long: countRequestsInWindow(
        data.timestamps,
        BURST_LIMITS.LONG_WINDOW.duration,
        currentTime,
      ),
    }

    const wouldBeAllowed =
      requestsInWindows.short < BURST_LIMITS.SHORT_WINDOW.maxRequests &&
      requestsInWindows.medium < BURST_LIMITS.MEDIUM_WINDOW.maxRequests &&
      requestsInWindows.long < BURST_LIMITS.LONG_WINDOW.maxRequests

    return {
      data,
      requestsInWindows,
      wouldBeAllowed,
    }
  } catch (error) {
    console.error('Error getting burst rate limit status:', error)
    return {
      data: null,
      requestsInWindows: { short: 0, medium: 0, long: 0 },
      wouldBeAllowed: true,
    }
  }
}
