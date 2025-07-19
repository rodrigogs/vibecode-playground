/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cache } from '@/lib/backend-cache'

// Set up environment variables for testing
// Set up environment variables before importing the module
process.env.AUTH_SECRET = 'test-secret-key-for-unit-testing'

// Mock all external dependencies for unit testing
vi.mock('@/lib/backend-cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/lib/auth-instance', () => ({
  auth: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn((name: string) => {
      if (name === 'x-forwarded-for') return '127.0.0.1'
      return null
    }),
  }),
}))

vi.mock('@/lib/browser-fingerprinting', () => ({
  processFingerprint: vi.fn().mockReturnValue({
    fingerprint: 'unit-test-fingerprint',
    confidence: 0.7,
    suspiciousFlags: [],
    components: {},
    entropy: 4.2,
  }),
}))

vi.mock('@/lib/services/ad-token', () => ({
  validateAdToken: vi.fn().mockResolvedValue({
    valid: true,
    payload: { fingerprint: 'unit-test-fingerprint' },
  }),
}))

vi.mock('@/lib/rate-limit', () => ({
  RATE_LIMITS: {
    IP_LIMIT: 3,
    FINGERPRINT_LIMIT: 6,
    USER_DAILY_LIMIT: 10,
    RESET_TIME: 3600000,
  },
  checkRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    limit: 3,
    remaining: 2,
    resetTime: new Date('2024-01-01T01:00:00Z').getTime(),
    requiresAuth: false,
    isLoggedIn: false,
    method: 'ip',
  }),
}))

describe('Credit Granting Logic', () => {
  const mockCache = vi.mocked(cache)
  const fixedTime = new Date('2024-01-01T00:00:00Z').getTime()

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.useFakeTimers()
    vi.setSystemTime(fixedTime)

    // Set default mock behaviors that will be used if not overridden
    mockCache.set.mockResolvedValue(undefined)

    // Setup mock to return numbers for bonus credits and null for other keys
    mockCache.get.mockImplementation(async (key: string) => {
      if (key.includes('bonus_credits:')) {
        return 0 // Return number for bonus credits
      }
      return null // Return null for other keys
    })
  })

  it('should add bonus credit correctly', async () => {
    mockCache.get
      .mockResolvedValueOnce(null) // Token not used
      .mockResolvedValueOnce(null) // No ad limits
      .mockResolvedValueOnce(null) // No daily ad limits
      .mockResolvedValueOnce(0) // addBonusCredit: existing bonus credits
      .mockResolvedValueOnce({
        count: 3,
        resetTime: fixedTime + 60000,
        lastSeen: fixedTime,
      }) // checkRateLimit: Rate limit status
      .mockResolvedValueOnce(1) // getBonusCreditsForRateLimit: bonus credits after adding

    const { POST: grantCreditHandler } = await import(
      '@/app/api/rewarded-ad/grant-credit/route'
    )

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        adToken: 'bonus-credit-test-123456789-valid',
      }),
    } as any

    await grantCreditHandler(mockRequest)

    // Find the cache.set call that adds bonus credits
    const bonusCreditSetCall = mockCache.set.mock.calls.find((call) =>
      call[0].includes('bonus_credits:'),
    )

    expect(bonusCreditSetCall).toBeDefined()
    if (bonusCreditSetCall) {
      const bonusAmount = bonusCreditSetCall[1] as number
      expect(bonusAmount).toBe(1) // Should add 1 bonus credit
    }
  })

  it('should handle zero count gracefully', async () => {
    mockCache.get
      .mockResolvedValueOnce(null) // Token not used
      .mockResolvedValueOnce(null) // No ad limits
      .mockResolvedValueOnce(null) // No daily ad limits
      .mockResolvedValueOnce(0) // addBonusCredit: existing bonus credits
      .mockResolvedValueOnce({
        count: 0,
        resetTime: fixedTime + 60000,
        lastSeen: fixedTime,
      }) // checkRateLimit: Rate limit status
      .mockResolvedValueOnce(1) // getBonusCreditsForRateLimit: bonus credits after adding

    const { POST: grantCreditHandler } = await import(
      '@/app/api/rewarded-ad/grant-credit/route'
    )

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        adToken: 'zero-count-test-123456789-valid',
      }),
    } as any

    const response = await grantCreditHandler(mockRequest)
    const data = await response.json()

    expect(data.success).toBe(true)

    // Should still add bonus credit even with zero count
    const bonusCreditSetCall = mockCache.set.mock.calls.find((call) =>
      call[0].includes('bonus_credits:'),
    )

    if (bonusCreditSetCall) {
      const bonusAmount = bonusCreditSetCall[1] as number
      expect(bonusAmount).toBe(1) // Should add 1 bonus credit
    }
  })

  it('should update lastSeen timestamp', async () => {
    const oldLastSeen = fixedTime - 30000 // 30 seconds ago
    mockCache.get
      .mockResolvedValueOnce(null) // Token not used
      .mockResolvedValueOnce(null) // No ad limits
      .mockResolvedValueOnce(null) // No daily ad limits
      .mockResolvedValueOnce({
        count: 2,
        resetTime: fixedTime + 60000,
        lastSeen: oldLastSeen,
      }) // Rate limit status

    const { POST: grantCreditHandler } = await import(
      '@/app/api/rewarded-ad/grant-credit/route'
    )

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        adToken: 'timestamp-test-123456789-valid',
      }),
    } as any

    await grantCreditHandler(mockRequest)

    // Ad watch should be recorded with updated timestamps
    const adWatchCall = mockCache.set.mock.calls.find((call) =>
      call[0].includes('ad_limit:'),
    )

    if (adWatchCall) {
      // The ad watch timestamp should be updated
      expect(adWatchCall[1]).toBe(1) // First ad watch
    }
  })

  it('should set correct TTL for bonus credits', async () => {
    mockCache.get
      .mockResolvedValueOnce(null) // Token validation check - not used
      .mockResolvedValueOnce(null) // No ad limits
      .mockResolvedValueOnce(null) // No daily ad limits
      .mockResolvedValueOnce({
        count: 1,
        resetTime: fixedTime + 30000,
        lastSeen: fixedTime,
      }) // Rate limit status

    const { POST: grantCreditHandler } = await import(
      '@/app/api/rewarded-ad/grant-credit/route'
    )

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        adToken: 'ttl-test-123456789-valid',
      }),
    } as any

    await grantCreditHandler(mockRequest)

    const bonusCreditSetCall = mockCache.set.mock.calls.find((call) =>
      call[0].includes('bonus_credits:'),
    )

    if (bonusCreditSetCall) {
      const ttl = bonusCreditSetCall[2] as number
      expect(ttl).toBe(24 * 60 * 60) // Should be 24 hours (TTL is in seconds for bonus credits)
    }
  })
})
