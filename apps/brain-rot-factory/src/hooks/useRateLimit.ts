'use client'

import { useCallback, useEffect, useState } from 'react'

import { RATE_LIMIT_CONFIG } from '@/lib/rate-limit-constants'

export interface RateLimitInfo {
  limit: number
  remaining: number
  resetTime: number
  requiresAuth: boolean
  isLoggedIn: boolean
  allowed: boolean
}

export interface UseRateLimitResult {
  rateLimitInfo: RateLimitInfo | null
  isLoading: boolean
  error: string | null
  checkRateLimit: () => Promise<void>
  timeUntilReset: number
}

export function useRateLimit(): UseRateLimitResult {
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeUntilReset, setTimeUntilReset] = useState(0)

  const checkRateLimit = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/rate-limit')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const text = await response.text()
      if (!text) {
        throw new Error('Empty response from server')
      }

      const data = JSON.parse(text)
      setRateLimitInfo(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Rate limit check failed: ${errorMessage}`)
      // Rate limit check error
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update time until reset every second
  useEffect(() => {
    if (!rateLimitInfo?.resetTime) {
      setTimeUntilReset(0)
      return
    }

    const updateTimer = () => {
      const now = Date.now()
      const reset = rateLimitInfo.resetTime
      const timeLeft = Math.max(0, reset - now)
      setTimeUntilReset(timeLeft)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [rateLimitInfo?.resetTime])

  // Initial load
  useEffect(() => {
    checkRateLimit()
  }, [checkRateLimit])

  return {
    rateLimitInfo,
    isLoading,
    error,
    checkRateLimit,
    timeUntilReset,
  }
}

export function formatTimeUntilReset(milliseconds: number): string {
  if (milliseconds <= 0) return 'Now'

  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${seconds}s`
  }
}

export function getRateLimitMessage(
  info: RateLimitInfo | null,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  if (!info) return ''

  if (!info.allowed) {
    if (info.requiresAuth) {
      return t('rateLimit.ipLimitExceeded', {
        limit: RATE_LIMIT_CONFIG.IP_LIMIT,
        userLimit: RATE_LIMIT_CONFIG.USER_DAILY_LIMIT,
      })
    } else {
      return t('rateLimit.userLimitExceeded', {
        limit: RATE_LIMIT_CONFIG.USER_DAILY_LIMIT,
      })
    }
  }

  if (info.isLoggedIn) {
    return t('rateLimit.userRemaining', {
      remaining: info.remaining,
      limit: info.limit,
    })
  } else {
    const baseMessage = t('rateLimit.anonymousRemaining', {
      remaining: info.remaining,
      limit: info.limit,
    })
    const authPrompt =
      info.remaining <= 1
        ? t('rateLimit.anonymousSignInPromptLast', {
            limit: RATE_LIMIT_CONFIG.USER_DAILY_LIMIT,
          })
        : t('rateLimit.anonymousSignInPrompt', {
            limit: RATE_LIMIT_CONFIG.USER_DAILY_LIMIT,
          })
    return baseMessage + ' ' + authPrompt
  }
}
