import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  mockAuth,
  mockCheckRateLimit,
  mockConsumeRateLimit,
  RATE_LIMITS,
  setupTest,
  teardownTest,
  testConstants,
} from './test-setup'

describe('Ad Rate Limiting Integration Tests', () => {
  beforeEach(setupTest)
  afterEach(teardownTest)

  it('should enforce hourly ad watching limits', async () => {
    mockAuth.mockResolvedValue(null)

    // Test rate limit for IP/fingerprint
    const status = await mockCheckRateLimit(null, null)
    expect(status.allowed).toBe(true)
    expect(status.remaining).toBe(RATE_LIMITS.IP_LIMIT)

    // Consume multiple times up to limit
    for (let i = 0; i < RATE_LIMITS.IP_LIMIT; i++) {
      await mockConsumeRateLimit(null, null)
    }

    // Should now be rate limited
    const limitedStatus = await mockCheckRateLimit(null, null)
    expect(limitedStatus.allowed).toBe(false)
    expect(limitedStatus.remaining).toBe(0)
  })

  it('should enforce daily ad watching limits', async () => {
    mockAuth.mockResolvedValue(null)

    // Test daily rate limit tracking
    const status = await mockCheckRateLimit(null, null)
    expect(status.allowed).toBe(true)
    expect(status.remaining).toBe(RATE_LIMITS.IP_LIMIT)

    // Verify rate limit consumption
    await mockConsumeRateLimit(null, null)

    const afterStatus = await mockCheckRateLimit(null, null)
    expect(afterStatus.remaining).toBe(RATE_LIMITS.IP_LIMIT - 1)
  })

  it('should track ad limits separately for authenticated users', async () => {
    // Test with authenticated user
    mockAuth.mockResolvedValue({
      user: { id: testConstants.testUserId },
      expires: new Date(
        testConstants.fixedTime + 24 * 60 * 60 * 1000,
      ).toISOString(),
    })

    // Test authenticated user rate limit
    const userSession = {
      user: { id: testConstants.testUserId },
      expires: new Date(
        testConstants.fixedTime + 24 * 60 * 60 * 1000,
      ).toISOString(),
    }

    const status = await mockCheckRateLimit(userSession, null)
    expect(status.allowed).toBe(true)
    expect(status.remaining).toBe(RATE_LIMITS.USER_DAILY_LIMIT)

    // Consume user rate limit
    await mockConsumeRateLimit(userSession, null)

    const afterStatus = await mockCheckRateLimit(userSession, null)
    expect(afterStatus.remaining).toBe(RATE_LIMITS.USER_DAILY_LIMIT - 1)
  })
})
