/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cache } from '@/lib/backend-cache'

// Mock all external dependencies for unit testing
vi.mock('@/lib/backend-cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    keys: vi.fn(),
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn((name: string) => {
      if (name === 'x-forwarded-for') return '127.0.0.1'
      if (name === 'user-agent') return 'Mozilla/5.0 (Test Browser)'
      return null
    }),
  })),
}))

vi.mock('@/lib/browser-fingerprinting', () => ({
  processFingerprint: vi.fn().mockReturnValue({
    fingerprint: 'test-fingerprint-123',
    confidence: 0.8,
    suspiciousFlags: [],
    components: {
      userAgent: 'Mozilla/5.0 (Test Browser)',
      screen: { width: 1920, height: 1080 },
      timezone: 'America/New_York',
    },
    entropy: 4.5,
  }),
}))

describe('Rate Limit Core Functions', () => {
  const mockCache = vi.mocked(cache)
  const fixedTime = new Date('2024-01-01T00:00:00Z').getTime()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(fixedTime)
    mockCache.get.mockResolvedValue(null)
    mockCache.set.mockResolvedValue(undefined)
  })

  describe('checkRateLimit', () => {
    it('should allow requests within IP limit', async () => {
      // Mock cache to return current count below limit for rate limit info
      // and null for bonus credits
      mockCache.get.mockImplementation((key: string) => {
        if (key.includes('rate_limit:ip:')) {
          return Promise.resolve({
            count: 2,
            resetTime: fixedTime + 3600000, // 1 hour from now
            lastSeen: fixedTime - 1000,
          })
        }
        if (key.includes('bonus_credits:')) {
          return Promise.resolve(null) // No bonus credits
        }
        return Promise.resolve(null)
      })

      const { checkRateLimit } = await import('@/lib/rate-limit')
      const result = await checkRateLimit(null, null)

      expect(result.allowed).toBe(true)
      expect(result.method).toBe('ip')
      expect(result.remaining).toBe(1) // 3 - 2 = 1
    })

    it('should deny requests exceeding IP limit', async () => {
      // Mock cache to return count at limit
      mockCache.get.mockImplementation((key: string) => {
        if (key.includes('rate_limit:ip:')) {
          return Promise.resolve({
            count: 3,
            resetTime: fixedTime + 3600000,
            lastSeen: fixedTime - 1000,
          })
        }
        if (key.includes('bonus_credits:')) {
          return Promise.resolve(null) // No bonus credits
        }
        return Promise.resolve(null)
      })

      const { checkRateLimit } = await import('@/lib/rate-limit')
      const result = await checkRateLimit(null, null)

      expect(result.allowed).toBe(false)
      expect(result.method).toBe('ip')
      expect(result.remaining).toBe(0)
    })

    it('should use fingerprint method when available', async () => {
      const fingerprintData = JSON.stringify({
        userAgent: 'Mozilla/5.0 (Test Browser)',
        screen: { width: 1920, height: 1080 },
        timezone: 'America/New_York',
      })

      // Mock cache to return IP limit exceeded but fingerprint available
      mockCache.get.mockImplementation((key: string) => {
        if (key.includes('rate_limit:ip:')) {
          return Promise.resolve({
            count: 3,
            resetTime: fixedTime + 3600000,
            lastSeen: fixedTime - 1000,
          }) // IP limit exceeded
        }
        if (key.includes('rate_limit:fingerprint:')) {
          return Promise.resolve({
            count: 0,
            resetTime: fixedTime + 3600000,
            lastSeen: fixedTime - 1000,
            confidence: 0.8,
          }) // Fingerprint limit not exceeded
        }
        if (key.includes('bonus_credits:')) {
          return Promise.resolve(null) // No bonus credits
        }
        return Promise.resolve(null)
      })

      const { checkRateLimit } = await import('@/lib/rate-limit')
      const result = await checkRateLimit(null, fingerprintData)

      expect(result.allowed).toBe(true)
      expect(result.method).toBe('fingerprint')
      expect(result.confidence).toBe(0.8)
      expect(result.remaining).toBe(3) // 3 - 0 = 3
    })

    it('should handle authenticated users with higher limits', async () => {
      const session = {
        user: { id: 'test-user-123' },
      }

      mockCache.get.mockImplementation((key: string) => {
        if (key.includes('rate_limit:user:')) {
          return Promise.resolve({
            count: 3,
            resetTime: fixedTime + 86400000, // 24 hours from now
            lastSeen: fixedTime - 1000,
          })
        }
        if (key.includes('bonus_credits:')) {
          return Promise.resolve(null) // No bonus credits
        }
        return Promise.resolve(null)
      })

      const { checkRateLimit } = await import('@/lib/rate-limit')
      const result = await checkRateLimit(session as any, null)

      expect(result.allowed).toBe(true)
      expect(result.method).toBe('user')
      expect(result.isLoggedIn).toBe(true)
      expect(result.remaining).toBe(7) // 10 - 3 = 7
    })

    it('should reset expired rate limits', async () => {
      // Mock cache to return expired rate limit
      mockCache.get.mockImplementation((key: string) => {
        if (key.includes('rate_limit:ip:')) {
          return Promise.resolve({
            count: 3,
            resetTime: fixedTime - 1000, // Expired
            lastSeen: fixedTime - 3600000,
          })
        }
        if (key.includes('bonus_credits:')) {
          return Promise.resolve(null) // No bonus credits
        }
        return Promise.resolve(null)
      })

      const { checkRateLimit } = await import('@/lib/rate-limit')
      const result = await checkRateLimit(null, null)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(3) // Fresh limit, 0 used initially
    })
  })

  describe('consumeRateLimit', () => {
    it('should consume rate limit and return updated count', async () => {
      mockCache.get.mockResolvedValue({
        count: 2,
        resetTime: fixedTime + 3600000,
        lastSeen: fixedTime - 1000,
      })

      const { consumeRateLimit } = await import('@/lib/rate-limit')
      const result = await consumeRateLimit(null, null)

      expect(result.allowed).toBe(true)
      expect(result.method).toBe('ip')
      expect(result.remaining).toBe(0) // 3 - 3 = 0
    })

    it('should deny when limit would be exceeded', async () => {
      mockCache.get.mockResolvedValue({
        count: 3,
        resetTime: fixedTime + 3600000,
        lastSeen: fixedTime - 1000,
      })

      const { consumeRateLimit } = await import('@/lib/rate-limit')
      const result = await consumeRateLimit(null, null)

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should handle authenticated users', async () => {
      const session = {
        user: { id: 'test-user-123' },
      }

      mockCache.get.mockResolvedValue({
        count: 5,
        resetTime: fixedTime + 86400000,
        lastSeen: fixedTime - 1000,
      })

      const { consumeRateLimit } = await import('@/lib/rate-limit')
      const result = await consumeRateLimit(session as any, null)

      expect(result.allowed).toBe(true)
      expect(result.method).toBe('user')
      expect(result.isLoggedIn).toBe(true)
      expect(result.remaining).toBe(4) // 10 - 6 = 4
    })
  })

  describe('getRateLimitStatus', () => {
    it('should return current rate limit status', async () => {
      mockCache.get.mockImplementation((key: string) => {
        if (key.includes('rate_limit:ip:')) {
          return Promise.resolve({
            count: 1,
            resetTime: fixedTime + 3600000,
            lastSeen: fixedTime - 1000,
          })
        }
        if (key.includes('bonus_credits:')) {
          return Promise.resolve(null) // No bonus credits
        }
        return Promise.resolve(null)
      })

      const { getRateLimitStatus } = await import('@/lib/rate-limit')
      const result = await getRateLimitStatus(null, null)

      expect(result.allowed).toBe(true)
      expect(result.method).toBe('ip')
      expect(result.remaining).toBe(2)
    })
  })

  describe('resetRateLimit', () => {
    it('should reset IP rate limit', async () => {
      const { resetRateLimit } = await import('@/lib/rate-limit')
      await resetRateLimit('127.0.0.1', 'ip')

      expect(mockCache.delete).toHaveBeenCalledWith('rate_limit:ip:127.0.0.1')
    })

    it('should reset user rate limit', async () => {
      const { resetRateLimit } = await import('@/lib/rate-limit')
      await resetRateLimit('test-user-123', 'user')

      expect(mockCache.delete).toHaveBeenCalledWith(
        'rate_limit:user:test-user-123',
      )
    })

    it('should reset fingerprint rate limit', async () => {
      const { resetRateLimit } = await import('@/lib/rate-limit')
      mockCache.keys.mockResolvedValue([
        'rate_limit:combined:127.0.0.1:test-fp',
      ])

      await resetRateLimit('test-fp', 'fingerprint')

      expect(mockCache.delete).toHaveBeenCalledWith(
        'rate_limit:fingerprint:test-fp',
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle cache errors gracefully', async () => {
      mockCache.get.mockRejectedValue(new Error('Cache error'))

      const { checkRateLimit } = await import('@/lib/rate-limit')
      const result = await checkRateLimit(null, null)

      // Should fall back to allowing the request
      expect(result.allowed).toBe(true)
      expect(result.method).toBe('ip')
    })

    it('should handle invalid fingerprint data', async () => {
      const invalidFingerprintData = {
        // Missing required fields
        userAgent: null,
      }

      const { checkRateLimit } = await import('@/lib/rate-limit')
      const result = await checkRateLimit(null, invalidFingerprintData as any)

      // Should fall back to IP-based rate limiting
      expect(result.method).toBe('ip')
    })

    it('should handle concurrent requests properly', async () => {
      mockCache.get.mockImplementation((key: string) => {
        if (key.includes('rate_limit:ip:')) {
          return Promise.resolve({
            count: 2,
            resetTime: fixedTime + 3600000,
            lastSeen: fixedTime - 1000,
          })
        }
        if (key.includes('bonus_credits:')) {
          return Promise.resolve(null) // No bonus credits
        }
        return Promise.resolve(null)
      })

      const { checkRateLimit } = await import('@/lib/rate-limit')

      // Simulate concurrent requests
      const promises = [
        checkRateLimit(null, null),
        checkRateLimit(null, null),
        checkRateLimit(null, null),
      ]

      const results = await Promise.all(promises)

      // All should get the same result based on current cache state
      results.forEach((result) => {
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(1)
      })
    })
  })
})
