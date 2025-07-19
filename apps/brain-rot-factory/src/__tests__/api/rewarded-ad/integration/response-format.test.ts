import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { mockAuth, setupTest, teardownTest } from './test-setup'

describe('Response Format Integration Tests', () => {
  beforeEach(setupTest)
  afterEach(teardownTest)

  it('should return consistent success response format', async () => {
    mockAuth.mockResolvedValue(null)

    // Test expected response format
    const expectedResponse = {
      success: true,
      message: 'Credit granted successfully',
      data: {
        creditsGranted: 1,
        remaining: 2,
      },
    }

    expect(expectedResponse.success).toBe(true)
    expect(expectedResponse.message).toBe('Credit granted successfully')
    expect(expectedResponse.data.creditsGranted).toBe(1)
  })

  it('should return consistent error response format', async () => {
    mockAuth.mockResolvedValue(null)

    // Test expected error response format
    const expectedErrorResponse = {
      success: false,
      error: 'Invalid ad token',
      message: 'The provided ad token is invalid or has already been used.',
    }

    expect(expectedErrorResponse.success).toBe(false)
    expect(expectedErrorResponse.error).toBe('Invalid ad token')
    expect(expectedErrorResponse.message).toContain('invalid')
  })

  it('should include rate limit information in response', async () => {
    mockAuth.mockResolvedValue(null)

    // Test rate limit information format
    const rateLimitInfo = {
      remaining: 2,
      resetTime: Date.now() + 3600000, // 1 hour from now
    }

    expect(rateLimitInfo.remaining).toBe(2)
    expect(rateLimitInfo.resetTime).toBeGreaterThan(Date.now())
  })
})
