/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cache } from '@/lib/backend-cache'
import { validateAdToken } from '@/lib/services/ad-token'

// Set up environment variables before importing anything
// Set up environment variables before importing the module
process.env.AUTH_SECRET = 'test-secret-for-ad-token-validation'

// Mock the ad-token service to avoid complex cache interactions
vi.mock('@/lib/services/ad-token', () => ({
  validateAdToken: vi.fn(),
  generateAdToken: vi.fn(),
}))

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

describe('Ad Token Validation', () => {
  const mockCache = vi.mocked(cache)
  const mockValidateAdToken = vi.mocked(validateAdToken)
  const fixedTime = new Date('2024-01-01T00:00:00Z').getTime()

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.useFakeTimers()
    vi.setSystemTime(fixedTime)

    // Set default mock behaviors that will be used if not overridden
    mockCache.set.mockResolvedValue(undefined)
    mockCache.get.mockResolvedValue(null) // Default: return null for any cache.get call
    mockValidateAdToken.mockResolvedValue({
      valid: false,
      reason: 'Invalid token format',
    })
  })

  it('should reject tokens that are too short', async () => {
    mockValidateAdToken.mockResolvedValue({
      valid: false,
      reason: 'Invalid token signature',
    })

    const { POST: grantCreditHandler } = await import(
      '@/app/api/rewarded-ad/grant-credit/route'
    )

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        adToken: 'short', // Less than 20 characters
        fingerprintData: JSON.stringify({ test: 'data' }),
      }),
    } as any

    const response = await grantCreditHandler(mockRequest)
    const data = await response.json()

    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid ad token')
    expect(data.message).toBe('Invalid token signature')
  })

  it('should reject null or undefined tokens', async () => {
    mockValidateAdToken.mockResolvedValue({
      valid: false,
      reason: 'Invalid token format',
    })

    const { POST: grantCreditHandler } = await import(
      '@/app/api/rewarded-ad/grant-credit/route'
    )

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        adToken: null,
      }),
    } as any

    const response = await grantCreditHandler(mockRequest)
    const data = await response.json()

    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid ad token')
    expect(data.message).toBe('Invalid token format')
  })

  it('should reject already used tokens', async () => {
    mockValidateAdToken.mockResolvedValue({
      valid: false,
      reason: 'Token already used',
    })

    const { POST: grantCreditHandler } = await import(
      '@/app/api/rewarded-ad/grant-credit/route'
    )

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        adToken: 'valid-length-but-used-token-12345',
        fingerprintData: JSON.stringify({ test: 'data' }),
      }),
    } as any

    const response = await grantCreditHandler(mockRequest)
    const data = await response.json()

    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid ad token')
    expect(data.message).toBe('Token already used')
  })

  it('should accept valid new tokens', async () => {
    // Mock successful token validation
    mockValidateAdToken.mockResolvedValue({
      valid: true,
      payload: {
        type: 'ad_completion',
        fingerprint: 'test-fingerprint',
        nonce: 'test-nonce',
        jti: 'test-jti',
        iat: Math.floor(fixedTime / 1000),
        exp: Math.floor(fixedTime / 1000) + 300,
      },
    })

    // Set up other mocks for the API route
    mockCache.get
      .mockResolvedValueOnce(null) // No hourly ad limit
      .mockResolvedValueOnce(null) // No daily ad limit
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
        adToken: 'valid-token-12345',
        fingerprintData: JSON.stringify({ test: 'data' }),
      }),
    } as any

    const response = await grantCreditHandler(mockRequest)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(mockCache.set).toHaveBeenCalled()
  })
})
