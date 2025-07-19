/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from 'vitest'

// Mock next/headers with proper structure
vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn((name: string) => {
      if (name === 'x-forwarded-for') return '127.0.0.1'
      if (name === 'user-agent') return 'Mozilla/5.0 (Test Browser)'
      return null
    }),
  })),
}))

// Mock next/server to avoid module resolution issues
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: vi.fn((data: any, init?: any) => ({
      json: vi.fn(() => Promise.resolve(data)),
      status: init?.status || 200,
    })),
  },
}))

export const mockAuth = vi.fn()
vi.mock('@/lib/auth-instance', () => ({
  auth: mockAuth,
}))

// Mock the cache module to avoid Redis dependencies
vi.mock('@/lib/cache', () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}))

// Mock rate limiting with proper session handling and IP mocking
const rateLimitStore = new Map()

const RATE_LIMITS = {
  IP_LIMIT: 3,
  FINGERPRINT_LIMIT: 6,
  USER_DAILY_LIMIT: 10,
  RESET_TIME: 3600000, // 1 hour
  HIGH_CONFIDENCE_THRESHOLD: 0.8,
  MEDIUM_CONFIDENCE_THRESHOLD: 0.5,
  SUSPICIOUS_FLAGS_THRESHOLD: 2,
}

const mockCheckRateLimit = vi
  .fn()
  .mockImplementation(async (session, fingerprint) => {
    const key = session?.user?.id || fingerprint || 'anonymous'
    const limit = session?.user?.id
      ? RATE_LIMITS.USER_DAILY_LIMIT
      : RATE_LIMITS.IP_LIMIT

    const current = rateLimitStore.get(key) || 0

    return {
      allowed: current < limit,
      remaining: limit - current,
      limit,
      resetTime: Date.now() + RATE_LIMITS.RESET_TIME,
    }
  })

const mockConsumeRateLimit = vi
  .fn()
  .mockImplementation(async (session, fingerprint) => {
    const key = session?.user?.id || fingerprint || 'anonymous'
    const current = rateLimitStore.get(key) || 0
    rateLimitStore.set(key, current + 1)

    return {
      allowed: true,
      remaining:
        (session?.user?.id
          ? RATE_LIMITS.USER_DAILY_LIMIT
          : RATE_LIMITS.IP_LIMIT) -
        (current + 1),
      limit: session?.user?.id
        ? RATE_LIMITS.USER_DAILY_LIMIT
        : RATE_LIMITS.IP_LIMIT,
      resetTime: Date.now() + RATE_LIMITS.RESET_TIME,
    }
  })

const mockResetRateLimit = vi.fn().mockImplementation(async (identifier) => {
  rateLimitStore.delete(identifier)
})

// Mock the entire rate-limit module
vi.mock('@/lib/rate-limit', () => ({
  RATE_LIMITS,
  checkRateLimit: mockCheckRateLimit,
  consumeRateLimit: mockConsumeRateLimit,
  resetRateLimit: mockResetRateLimit,
}))

vi.mock('@/lib/browser-fingerprinting', () => ({
  processFingerprint: vi.fn().mockReturnValue({
    fingerprint: 'integration-test-fingerprint',
    confidence: 0.8,
    suspiciousFlags: [],
    components: {
      userAgent: 'Mozilla/5.0 (Test Browser)',
      screen: { width: 1920, height: 1080 },
      timezone: 'America/New_York',
      language: 'en-US',
    },
    entropy: 4.8,
  }),
}))

export const testConstants = {
  fixedTime: new Date('2024-01-01T00:00:00Z').getTime(),
  testIP: '127.0.0.1',
  testUserId: 'integration-test-user',
  testFingerprint: 'integration-test-fingerprint',
}

export const setupTest = async () => {
  vi.useFakeTimers()
  vi.setSystemTime(testConstants.fixedTime)

  // Clear the rate limit store
  rateLimitStore.clear()
}

export const teardownTest = () => {
  vi.useRealTimers()
  rateLimitStore.clear()
}

export const createAdRequest = (adToken: string, fingerprintData?: any) => {
  return new Request('http://localhost/api/rewarded-ad/grant-credit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adToken,
      fingerprintData:
        fingerprintData ||
        JSON.stringify({
          userAgent: 'Mozilla/5.0 (Test Browser)',
        }),
    }),
  })
}

// Export the mocked functions for direct access in tests
export {
  mockCheckRateLimit,
  mockConsumeRateLimit,
  mockResetRateLimit,
  RATE_LIMITS,
}
