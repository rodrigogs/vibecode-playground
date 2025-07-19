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

describe('Fingerprint Processing', () => {
  const mockCache = vi.mocked(cache)
  const fixedTime = new Date('2024-01-01T00:00:00Z').getTime()

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.useFakeTimers()
    vi.setSystemTime(fixedTime)

    // Set default mock behaviors that will be used if not overridden
    mockCache.set.mockResolvedValue(undefined)
    mockCache.get.mockResolvedValue(null) // Default: return null for any cache.get call
  })

  it('should handle valid fingerprint data', async () => {
    mockCache.get
      .mockResolvedValueOnce(null) // Token not used
      .mockResolvedValueOnce(null) // No ad limits
      .mockResolvedValueOnce(null) // No daily ad limits
      .mockResolvedValueOnce({
        count: 1,
        resetTime: fixedTime + 60000,
        lastSeen: fixedTime,
      }) // Rate limit status
      .mockResolvedValueOnce({
        count: 1,
        resetTime: fixedTime + 60000,
        lastSeen: fixedTime,
      }) // Rate limit info

    const { POST: grantCreditHandler } = await import(
      '@/app/api/rewarded-ad/grant-credit/route'
    )

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        adToken: 'fingerprint-test-123456789-valid',
        fingerprintData: JSON.stringify({
          userAgent: 'Mozilla/5.0',
          screen: { width: 1920, height: 1080 },
        }),
      }),
    } as any

    const response = await grantCreditHandler(mockRequest)
    const data = await response.json()

    expect(data.success).toBe(true)
  })

  it('should handle malformed fingerprint data gracefully', async () => {
    mockCache.get
      .mockResolvedValueOnce(null) // Token not used
      .mockResolvedValueOnce(null) // No ad limits
      .mockResolvedValueOnce(null) // No daily ad limits
      .mockResolvedValueOnce({
        count: 1,
        resetTime: fixedTime + 60000,
        lastSeen: fixedTime,
      }) // Rate limit status
      .mockResolvedValueOnce({
        count: 1,
        resetTime: fixedTime + 60000,
        lastSeen: fixedTime,
      }) // Rate limit info

    const { POST: grantCreditHandler } = await import(
      '@/app/api/rewarded-ad/grant-credit/route'
    )

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        adToken: 'malformed-fp-test-123456789-valid',
        fingerprintData: 'invalid-json-data',
      }),
    } as any

    const response = await grantCreditHandler(mockRequest)
    const data = await response.json()

    expect(data.success).toBe(true) // Should still succeed
  })

  it('should handle undefined fingerprint data', async () => {
    mockCache.get
      .mockResolvedValueOnce(null) // Token not used
      .mockResolvedValueOnce(null) // No ad limits
      .mockResolvedValueOnce(null) // No daily ad limits
      .mockResolvedValueOnce({
        count: 1,
        resetTime: fixedTime + 60000,
        lastSeen: fixedTime,
      }) // Rate limit status
      .mockResolvedValueOnce({
        count: 1,
        resetTime: fixedTime + 60000,
        lastSeen: fixedTime,
      }) // Rate limit info

    const { POST: grantCreditHandler } = await import(
      '@/app/api/rewarded-ad/grant-credit/route'
    )

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        adToken: 'no-fingerprint-test-123456789-valid',
        fingerprintData: undefined,
      }),
    } as any

    const response = await grantCreditHandler(mockRequest)
    const data = await response.json()

    expect(data.success).toBe(true)
  })
})
