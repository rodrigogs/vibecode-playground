'use client'

import { useCallback, useEffect, useState } from 'react'

import { useFingerprint } from '@/hooks/useFingerprint'

export interface RateLimitInfo {
  remaining: number
  resetTime: number
  requiresAuth: boolean
  isLoggedIn: boolean
  allowed: boolean
  method: string
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
  const { fingerprint, isLoading: fingerprintLoading } = useFingerprint()

  const checkRateLimit = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Include fingerprint data to match the chat API behavior
      const url = new URL('/api/rate-limit', window.location.origin)
      if (fingerprint) {
        url.searchParams.set('fingerprint', fingerprint)
      }

      const response = await fetch(url.toString())

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
  }, [fingerprint])

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

  // Only check rate limit when fingerprint loading is complete
  // This prevents multiple requests during fingerprint generation
  useEffect(() => {
    if (!fingerprintLoading) {
      checkRateLimit()
    }
  }, [fingerprintLoading, checkRateLimit])

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
      return t('rateLimit.ipLimitExceeded')
    } else {
      return t('rateLimit.userLimitExceeded')
    }
  }

  if (info.isLoggedIn) {
    return t('rateLimit.userRemaining', {
      remaining: info.remaining,
    })
  } else {
    const baseMessage = t('rateLimit.anonymousRemaining', {
      remaining: info.remaining,
    })
    const authPrompt =
      info.remaining <= 1
        ? t('rateLimit.anonymousSignInPromptLast')
        : t('rateLimit.anonymousSignInPrompt')
    return baseMessage + ' ' + authPrompt
  }
}
