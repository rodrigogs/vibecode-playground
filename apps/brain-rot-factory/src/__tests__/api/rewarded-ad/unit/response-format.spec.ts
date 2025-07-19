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

describe('Response Format Validation', () => {
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

  it('should return correct success response format', async () => {
    mockCache.get
      .mockResolvedValueOnce(null) // Token not used
      .mockResolvedValueOnce(null) // No ad limits
      .mockResolvedValueOnce(null) // No daily ad limits
      .mockResolvedValueOnce({
        count: 1,
        resetTime: fixedTime + 60000,
        lastSeen: fixedTime,
      })
      .mockResolvedValueOnce({
        count: 1,
        resetTime: fixedTime + 60000,
        lastSeen: fixedTime,
      })

    const { POST: grantCreditHandler } = await import(
      '@/app/api/rewarded-ad/grant-credit/route'
    )

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        adToken: 'response-format-test-123456789-valid',
      }),
    } as any

    const response = await grantCreditHandler(mockRequest)
    const data = await response.json()

    expect(data).toHaveProperty('success')
    expect(data).toHaveProperty('remaining')
    expect(data).toHaveProperty('resetTime')
    expect(data.success).toBe(true)
    expect(typeof data.remaining).toBe('number')
    expect(typeof data.resetTime).toBe('number')
  })

  it('should return correct error response format', async () => {
    const { validateAdToken } = await import('@/lib/services/ad-token')
    const mockValidateAdToken = validateAdToken as any

    // Mock validation to fail for short tokens
    mockValidateAdToken.mockResolvedValueOnce({
      valid: false,
      reason: 'Invalid token format',
    })

    const { POST: grantCreditHandler } = await import(
      '@/app/api/rewarded-ad/grant-credit/route'
    )

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        adToken: 'short', // Invalid token
      }),
    } as any

    const response = await grantCreditHandler(mockRequest)
    const data = await response.json()

    expect(data).toHaveProperty('success')
    expect(data).toHaveProperty('error')
    expect(data).toHaveProperty('message')
    expect(data.success).toBe(false)
    expect(typeof data.error).toBe('string')
    expect(typeof data.message).toBe('string')
  })

  it('should return appropriate HTTP status codes', async () => {
    const { validateAdToken } = await import('@/lib/services/ad-token')
    const mockValidateAdToken = validateAdToken as any

    const { POST: grantCreditHandler } = await import(
      '@/app/api/rewarded-ad/grant-credit/route'
    )

    // Success case
    mockValidateAdToken.mockResolvedValueOnce({
      valid: true,
      payload: { fingerprint: 'status-test-fingerprint' },
    })

    mockCache.get
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ count: 1, resetTime: fixedTime + 60000 })

    const successRequest = {
      json: vi.fn().mockResolvedValue({
        adToken: 'status-test-success-123456789-valid',
      }),
    } as any

    const successResponse = await grantCreditHandler(successRequest)
    expect(successResponse.status).toBe(200)

    // Error case
    mockValidateAdToken.mockResolvedValueOnce({
      valid: false,
      reason: 'Invalid token format',
    })

    const errorRequest = {
      json: vi.fn().mockResolvedValue({
        adToken: 'invalid',
      }),
    } as any

    const errorResponse = await grantCreditHandler(errorRequest)
    expect(errorResponse.status).toBe(400)
  })
})
