/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cache } from '@/lib/backend-cache'
import { validateAdToken } from '@/lib/services/ad-token'

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
  headers: vi.fn(() => ({
    get: vi.fn((name: string) => {
      if (name === 'x-forwarded-for') return '127.0.0.1'
      return null
    }),
  })),
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

vi.mock('@/lib/rate-limit', async () => {
  const actual = (await vi.importActual('@/lib/rate-limit')) as any
  return {
    ...actual,
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
    checkAdRateLimit: vi.fn().mockResolvedValue({
      allowed: true,
      message: 'Within limits',
    }),
  }
})

describe('Ad Rate Limiting', () => {
  const mockCache = vi.mocked(cache)
  const fixedTime = new Date('2024-01-01T00:00:00Z').getTime()
  let grantCreditHandler: any

  beforeEach(async () => {
    // Reset everything completely
    vi.clearAllMocks()
    vi.resetModules()
    vi.resetAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(fixedTime)

    // Set default mock behaviors that will be used if not overridden
    mockCache.set.mockResolvedValue(undefined)
    mockCache.get.mockResolvedValue(null) // Default: return null for any cache.get call

    // Reset validateAdToken mock to return valid result by default
    const mockValidateAdToken = vi.mocked(validateAdToken)
    mockValidateAdToken.mockResolvedValue({
      valid: true,
      payload: {
        type: 'ad_completion',
        fingerprint: 'unit-test-fingerprint',
        nonce: 'test-nonce',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300,
        jti: 'test-jti',
      },
    })

    // Get the mocked checkRateLimit function from rate-limit module
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const mockCheckRateLimit = vi.mocked(checkRateLimit)
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      limit: 3,
      remaining: 2,
      resetTime: new Date('2024-01-01T01:00:00Z').getTime(),
      requiresAuth: false,
      isLoggedIn: false,
      method: 'ip',
    })

    // Re-establish the processFingerprint mock
    const { processFingerprint } = await import('@/lib/browser-fingerprinting')
    const mockProcessFingerprint = vi.mocked(processFingerprint)
    mockProcessFingerprint.mockReturnValue({
      fingerprint: 'unit-test-fingerprint',
      confidence: 0.7,
      suspiciousFlags: [],
      components: {},
      entropy: 4.2,
    })

    // Import the handler fresh for each test
    const routeModule = await import('@/app/api/rewarded-ad/grant-credit/route')
    grantCreditHandler = routeModule.POST
  })

  it('should enforce hourly ad limit', async () => {
    // Set up cache mocks to simulate hourly rate limit exceeded
    mockCache.get.mockImplementation((key: string) => {
      if (key === 'ad_limit:fingerprint:hourly:unit-test-fingerprint') {
        return Promise.resolve(4) // Hourly limit exceeded (4 >= 3)
      }
      if (key === 'ad_limit:fingerprint:daily:unit-test-fingerprint') {
        return Promise.resolve(5) // Daily limit not reached yet (5 < 10)
      }
      return Promise.resolve(null) // Default for other keys
    })

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        adToken: 'hourly-limit-test-123456789-valid',
        fingerprintData: JSON.stringify({ canvas: 'test' }),
      }),
    } as any

    const { POST: grantCreditHandler } = await import(
      '@/app/api/rewarded-ad/grant-credit/route'
    )
    const response = await grantCreditHandler(mockRequest)
    const data = await response.json()

    expect(data.success).toBe(false)
    expect(data.error).toBe('Ad rate limit exceeded')
  })

  it('should enforce daily ad limit', async () => {
    // Set up cache mocks to simulate daily rate limit exceeded
    mockCache.get.mockImplementation((key: string) => {
      if (key === 'ad_limit:fingerprint:hourly:unit-test-fingerprint') {
        return Promise.resolve(2) // Hourly limit not reached (2 < 3)
      }
      if (key === 'ad_limit:fingerprint:daily:unit-test-fingerprint') {
        return Promise.resolve(11) // Daily limit exceeded (11 >= 10)
      }
      return Promise.resolve(null) // Default for other keys
    })

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        adToken: 'daily-limit-test-123456789-valid',
        fingerprintData: JSON.stringify({ canvas: 'test' }),
      }),
    } as any

    const response = await grantCreditHandler(mockRequest)
    const data = await response.json()

    expect(data.success).toBe(false)
    expect(data.error).toBe('Ad rate limit exceeded')
  })

  it('should allow ads when within limits', async () => {
    // Set up cache mocks to simulate within limits
    mockCache.get.mockImplementation((key: string) => {
      if (key === 'ad_limit:fingerprint:hourly:unit-test-fingerprint') {
        return Promise.resolve(1) // Hourly limit not reached (1 < 3)
      }
      if (key === 'ad_limit:fingerprint:daily:unit-test-fingerprint') {
        return Promise.resolve(5) // Daily limit not reached (5 < 10)
      }
      if (key.includes('rate_limit:ip:')) {
        return Promise.resolve({
          count: 2,
          resetTime: fixedTime + 60000,
          lastSeen: fixedTime,
        })
      }
      return Promise.resolve(null) // Default for other keys
    })

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        adToken: 'within-limits-test-123456789-valid',
      }),
    } as any

    const response = await grantCreditHandler(mockRequest)
    const data = await response.json()

    console.log('Within limits test response:', data)

    expect(data.success).toBe(true)
  })
})
