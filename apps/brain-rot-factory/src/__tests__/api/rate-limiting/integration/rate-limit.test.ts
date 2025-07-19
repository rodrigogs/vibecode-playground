/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  checkRateLimit,
  consumeRateLimit,
  getRateLimitStatus,
  RATE_LIMITS,
  resetRateLimit,
} from '@/lib/rate-limit'
import { resetBurstRateLimit } from '@/lib/utils/burst-rate-limit'

// Mock only external dependencies, not the rate limit functions themselves
vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn((name: string) => {
      if (name === 'x-forwarded-for') return '192.168.1.100'
      if (name === 'user-agent') return 'Mozilla/5.0 (Test Browser)'
      return null
    }),
  })),
}))

vi.mock('@/lib/browser-fingerprinting', () => ({
  processFingerprint: vi.fn().mockReturnValue({
    fingerprint: 'integration-test-fingerprint-abc123',
    confidence: 0.9,
    suspiciousFlags: [],
    components: {
      userAgent: 'Mozilla/5.0 (Test Browser)',
      screen: { width: 1920, height: 1080 },
      timezone: 'America/New_York',
      language: 'en-US',
    },
    entropy: 5.2,
  }),
}))

describe('Rate Limiting Integration Tests', () => {
  const fixedTime = new Date('2024-01-01T00:00:00Z').getTime()
  const testIP = '192.168.1.100'
  const testUserId = 'integration-test-user-123'
  const testFingerprint = 'integration-test-fingerprint-abc123'

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(fixedTime)

    // Clear any existing rate limit data
    await resetRateLimit(testIP, 'ip')
    await resetRateLimit(testUserId, 'user')
    await resetRateLimit(testFingerprint, 'fingerprint')

    // Clear burst rate limit data as well
    await resetBurstRateLimit(testIP, 'ip')
    await resetBurstRateLimit(testUserId, 'user')
    await resetBurstRateLimit(testFingerprint, 'fingerprint')
  })

  describe('Anonymous User IP-based Rate Limiting', () => {
    it('should allow requests up to IP limit', async () => {
      // Make requests up to the IP limit
      for (let i = 0; i < RATE_LIMITS.IP_LIMIT; i++) {
        const result = await consumeRateLimit(null, null)
        expect(result.allowed).toBe(true)
        expect(result.method).toBe('ip')
        expect(result.remaining).toBe(RATE_LIMITS.IP_LIMIT - i - 1)
        expect(result.isLoggedIn).toBe(false)
      }
    })

    it('should deny requests after IP limit is exceeded', async () => {
      // Consume all available requests
      for (let i = 0; i < RATE_LIMITS.IP_LIMIT; i++) {
        await consumeRateLimit(null, null)
      }

      // Next request should be denied
      const result = await checkRateLimit(null, null)
      expect(result.allowed).toBe(false)
      expect(result.method).toBe('ip')
      expect(result.remaining).toBe(0)
      expect(result.requiresAuth).toBe(true)
    })

    it('should track remaining count correctly as requests are consumed', async () => {
      // Check initial state
      let status = await getRateLimitStatus(null, null)
      expect(status.remaining).toBe(RATE_LIMITS.IP_LIMIT)

      // Consume one request
      await consumeRateLimit(null, null)
      status = await getRateLimitStatus(null, null)
      expect(status.remaining).toBe(RATE_LIMITS.IP_LIMIT - 1)

      // Consume another request
      await consumeRateLimit(null, null)
      status = await getRateLimitStatus(null, null)
      expect(status.remaining).toBe(RATE_LIMITS.IP_LIMIT - 2)
    })
  })

  describe('Fingerprint-based Rate Limiting', () => {
    it('should provide different limits with fingerprint data', async () => {
      const fingerprintData = JSON.stringify({
        userAgent: 'Mozilla/5.0 (Test Browser)',
        screen: { width: 1920, height: 1080 },
        timezone: 'America/New_York',
        language: 'en-US',
      })

      // First, exhaust IP limit
      for (let i = 0; i < RATE_LIMITS.IP_LIMIT; i++) {
        await consumeRateLimit(null, null)
      }

      // Check that IP limit is exhausted
      const ipResult = await checkRateLimit(null, null)
      expect(ipResult.allowed).toBe(false)

      // With fingerprint data, should get a different (potentially higher) limit
      const fingerprintResult = await checkRateLimit(null, fingerprintData)
      // The result should either be allowed (if using different method) or provide a higher limit
      expect(fingerprintResult.limit).toBeGreaterThanOrEqual(
        RATE_LIMITS.IP_LIMIT,
      )

      // With high confidence fingerprint, should use 'combined' method
      if (fingerprintResult.confidence && fingerprintResult.confidence > 0.8) {
        expect(fingerprintResult.method).toBe('combined')
      }
    })

    it('should allow same requests with fingerprint as IP alone', async () => {
      const fingerprintData = JSON.stringify({
        userAgent: 'Mozilla/5.0 (Test Browser)',
        screen: { width: 1920, height: 1080 },
        timezone: 'America/New_York',
        language: 'en-US',
      })

      // Consume up to the fingerprint limit
      let successfulRequests = 0
      for (let i = 0; i < RATE_LIMITS.FINGERPRINT_LIMIT; i++) {
        const result = await consumeRateLimit(null, fingerprintData)
        if (result.allowed) {
          successfulRequests++
        } else {
          break
        }
      }

      // Should have allowed same as IP limit
      expect(successfulRequests).toBe(RATE_LIMITS.IP_LIMIT)
    })
  })

  describe('Authenticated User Rate Limiting', () => {
    it('should provide higher limits for authenticated users', async () => {
      const session = {
        user: { id: testUserId },
      }

      // Consume up to user limit
      for (let i = 0; i < RATE_LIMITS.USER_DAILY_LIMIT; i++) {
        const result = await consumeRateLimit(session as any, null)
        expect(result.allowed).toBe(true)
        expect(result.method).toBe('user')
        expect(result.isLoggedIn).toBe(true)
        expect(result.remaining).toBe(RATE_LIMITS.USER_DAILY_LIMIT - i - 1)
      }

      // Next request should be denied
      const result = await checkRateLimit(session as any, null)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should isolate rate limits between different users', async () => {
      const session1 = { user: { id: 'user-1' } }
      const session2 = { user: { id: 'user-2' } }

      // Reset burst limits for both users specifically
      await resetBurstRateLimit('user-1', 'user')
      await resetBurstRateLimit('user-2', 'user')

      // Consume limits for user 1
      for (let i = 0; i < RATE_LIMITS.USER_DAILY_LIMIT; i++) {
        await consumeRateLimit(session1 as any, null)
      }

      // User 1 should be limited
      const user1Result = await checkRateLimit(session1 as any, null)
      expect(user1Result.allowed).toBe(false)

      // Reset burst limits for user 2 again to be safe
      await resetBurstRateLimit('user-2', 'user')

      // User 2 should still have full limits
      const user2Result = await checkRateLimit(session2 as any, null)
      expect(user2Result.allowed).toBe(true)
      expect(user2Result.remaining).toBe(RATE_LIMITS.USER_DAILY_LIMIT)
    })
  })

  describe('Rate Limit Reset and Expiration', () => {
    it('should reset rate limits after expiration time', async () => {
      // Consume all IP requests
      for (let i = 0; i < RATE_LIMITS.IP_LIMIT; i++) {
        await consumeRateLimit(null, null)
      }

      // Verify limit is reached
      let result = await checkRateLimit(null, null)
      expect(result.allowed).toBe(false)

      // Advance time beyond reset time
      vi.setSystemTime(fixedTime + RATE_LIMITS.RESET_TIME + 1000)

      // Should now be allowed again
      result = await checkRateLimit(null, null)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(RATE_LIMITS.IP_LIMIT)
    })

    it('should manually reset rate limits', async () => {
      // Consume all requests
      for (let i = 0; i < RATE_LIMITS.IP_LIMIT; i++) {
        await consumeRateLimit(null, null)
      }

      // Verify limit is reached
      let result = await checkRateLimit(null, null)
      expect(result.allowed).toBe(false)

      // Manually reset
      await resetRateLimit(testIP, 'ip')

      // Should now be allowed
      result = await checkRateLimit(null, null)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(RATE_LIMITS.IP_LIMIT)
    })
  })

  describe('Rate Limit Persistence', () => {
    it('should persist rate limit state across multiple checks', async () => {
      // Consume some requests
      await consumeRateLimit(null, null)
      await consumeRateLimit(null, null)

      // Check status multiple times
      const status1 = await getRateLimitStatus(null, null)
      const status2 = await getRateLimitStatus(null, null)
      const status3 = await getRateLimitStatus(null, null)

      // All should show the same state
      expect(status1.remaining).toBe(RATE_LIMITS.IP_LIMIT - 2)
      expect(status2.remaining).toBe(RATE_LIMITS.IP_LIMIT - 2)
      expect(status3.remaining).toBe(RATE_LIMITS.IP_LIMIT - 2)
    })

    it('should handle concurrent requests correctly', async () => {
      // Make multiple concurrent requests that exceed the limit
      const promises = []
      const totalRequests = RATE_LIMITS.IP_LIMIT + 2

      for (let i = 0; i < totalRequests; i++) {
        promises.push(consumeRateLimit(null, null))
      }

      const results = await Promise.all(promises)

      // Count successful requests
      const successfulRequests = results.filter((r) => r.allowed).length

      // Should not exceed the IP limit (might be less due to race conditions)
      expect(successfulRequests).toBeLessThanOrEqual(RATE_LIMITS.IP_LIMIT)

      // Should have some denied requests
      expect(successfulRequests).toBeLessThan(totalRequests)
    })
  })

  describe('Error Handling and Resilience', () => {
    it('should handle cache failures gracefully', async () => {
      // Mock cache failure by importing and mocking the cache module
      const cacheModule = await import('@/lib/backend-cache')
      const originalGet = cacheModule.cache.get
      const originalSet = cacheModule.cache.set

      // Mock cache operations to fail
      cacheModule.cache.get = vi
        .fn()
        .mockRejectedValue(new Error('Cache unavailable'))
      cacheModule.cache.set = vi
        .fn()
        .mockRejectedValue(new Error('Cache unavailable'))

      // Should fall back to allowing requests
      const result = await checkRateLimit(null, null)
      expect(result.allowed).toBe(true)

      // Restore original functions
      cacheModule.cache.get = originalGet
      cacheModule.cache.set = originalSet
    })

    it('should handle invalid fingerprint data gracefully', async () => {
      const invalidFingerprint = 'invalid-json-data'

      // Should fall back to IP-based limiting
      const result = await checkRateLimit(null, invalidFingerprint)
      expect(result.method).toBe('ip')
      expect(result.allowed).toBe(true)
    })
  })

  describe('Rate Limit Transitions', () => {
    it('should transition from anonymous to authenticated properly', async () => {
      // Start as anonymous user
      await consumeRateLimit(null, null)
      await consumeRateLimit(null, null)

      let status = await getRateLimitStatus(null, null)
      expect(status.remaining).toBe(RATE_LIMITS.IP_LIMIT - 2)

      // Now authenticate
      const session = { user: { id: testUserId } }
      status = await getRateLimitStatus(session as any, null)

      // Should have full user limits
      expect(status.method).toBe('user')
      expect(status.remaining).toBe(RATE_LIMITS.USER_DAILY_LIMIT)
      expect(status.isLoggedIn).toBe(true)
    })

    it('should handle method escalation correctly', async () => {
      const fingerprintData = JSON.stringify({
        userAgent: 'Mozilla/5.0 (Test Browser)',
        screen: { width: 1920, height: 1080 },
        timezone: 'America/New_York',
      })

      // Start with IP-based limiting
      await consumeRateLimit(null, null)

      // With fingerprint data, should provide potentially higher limits
      const result = await checkRateLimit(null, fingerprintData)
      expect(result.limit).toBeGreaterThanOrEqual(RATE_LIMITS.IP_LIMIT)
      expect(result.remaining).toBeGreaterThanOrEqual(0)
    })
  })
})
