import jwt from 'jsonwebtoken'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Import the type separately for TypeScript
import type { AdTokenPayload } from '@/lib/services/ad-token'

// Set up environment variables before importing the module
process.env.AUTH_SECRET = 'test-secret-key-for-jwt-signing'

// Mock the cache module first
vi.mock('@/lib/backend-cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
}))

const { cache } = await import('@/lib/backend-cache')
const { generateAdToken, validateAdToken } = await import(
  '@/lib/services/ad-token'
)

const mockCache = vi.mocked(cache)

// Mock environment variables
const mockSecret = 'test-secret-key-for-jwt-signing'
const originalEnv = process.env

describe('Ad Token Validation', () => {
  const testFingerprint = 'test-fingerprint-12345'

  beforeEach(() => {
    process.env.AUTH_SECRET = mockSecret
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    process.env = originalEnv
    vi.useRealTimers()
  })

  describe('validateAdToken', () => {
    let validToken: string
    let tokenPayload: AdTokenPayload

    beforeEach(async () => {
      const mockCurrentTime = 1640995200000
      vi.setSystemTime(mockCurrentTime)

      mockCache.set.mockResolvedValue(undefined)
      validToken = await generateAdToken(testFingerprint)
      tokenPayload = jwt.decode(validToken) as AdTokenPayload
    })

    it('should validate a valid token successfully', async () => {
      // Mock cache responses
      mockCache.get
        .mockResolvedValueOnce(null) // Token not used
        .mockResolvedValueOnce(testFingerprint) // Token in valid cache

      mockCache.set.mockResolvedValue(undefined)
      mockCache.delete.mockResolvedValue(undefined)

      const result = await validateAdToken(validToken, testFingerprint)

      expect(result.valid).toBe(true)
      expect(result.payload).toEqual(tokenPayload)

      // Verify token is marked as used
      expect(mockCache.set).toHaveBeenCalledWith(
        `ad_token:used:${tokenPayload.jti}`,
        'used',
        24 * 60 * 60 * 1000,
      )

      // Verify token is removed from valid cache
      expect(mockCache.delete).toHaveBeenCalledWith(
        `ad_token:valid:${tokenPayload.jti}`,
      )
    })

    it('should reject invalid token format', async () => {
      const result = await validateAdToken('', testFingerprint)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Invalid token format')
    })

    it('should reject invalid fingerprint', async () => {
      const result = await validateAdToken(validToken, '')

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Invalid fingerprint')
    })

    it('should reject tokens with wrong fingerprint', async () => {
      const wrongFingerprint = 'wrong-fingerprint'

      const result = await validateAdToken(validToken, wrongFingerprint)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Fingerprint mismatch')
    })

    it('should reject already used tokens', async () => {
      mockCache.get.mockResolvedValueOnce('used') // Token already used

      const result = await validateAdToken(validToken, testFingerprint)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Token already used')
    })

    it('should reject tokens not in valid cache', async () => {
      mockCache.get
        .mockResolvedValueOnce(null) // Token not used
        .mockResolvedValueOnce(null) // Token not in valid cache

      const result = await validateAdToken(validToken, testFingerprint)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Token not found in valid tokens')
    })

    it('should reject tokens with mismatched stored fingerprint', async () => {
      mockCache.get
        .mockResolvedValueOnce(null) // Token not used
        .mockResolvedValueOnce('different-fingerprint') // Different fingerprint in cache

      const result = await validateAdToken(validToken, testFingerprint)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Stored fingerprint mismatch')
    })

    it('should reject expired tokens', async () => {
      // Set time to future to make current token expired
      const futureTime = Date.now() + 400 * 1000 // 400 seconds in the future
      vi.setSystemTime(futureTime)

      const result = await validateAdToken(validToken, testFingerprint)

      expect(result.valid).toBe(false)
      // JWT library handles expiration, so we expect signature validation failure
      expect(result.reason).toBe('Invalid token signature')
    })

    it('should reject tokens with invalid signature', async () => {
      const invalidToken = jwt.sign(
        { type: 'ad_completion', fingerprint: testFingerprint },
        'wrong-secret',
        { algorithm: 'HS256' },
      )

      const result = await validateAdToken(invalidToken, testFingerprint)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Invalid token signature')
    })

    it('should reject tokens with invalid type', async () => {
      const invalidPayload = {
        type: 'invalid_type',
        fingerprint: testFingerprint,
        nonce: 'test-nonce',
        jti: 'test-jti',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300,
      }

      const invalidToken = jwt.sign(invalidPayload, mockSecret, {
        algorithm: 'HS256',
      })

      const result = await validateAdToken(invalidToken, testFingerprint)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Invalid token type')
    })

    it('should continue gracefully if cache operations fail', async () => {
      mockCache.get
        .mockResolvedValueOnce(null) // Token not used
        .mockResolvedValueOnce(testFingerprint) // Token in valid cache

      mockCache.set.mockRejectedValue(new Error('Cache error'))
      mockCache.delete.mockRejectedValue(new Error('Cache error'))

      const result = await validateAdToken(validToken, testFingerprint)

      expect(result.valid).toBe(true)
      expect(result.payload).toEqual(tokenPayload)
    })

    it('should handle malformed JWT tokens', async () => {
      const result = await validateAdToken('not.a.jwt', testFingerprint)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Invalid token signature')
    })

    it('should handle tokens with missing required fields', async () => {
      const incompletePayload = {
        type: 'ad_completion',
        // Missing fingerprint, nonce, etc.
      }

      const incompleteToken = jwt.sign(incompletePayload, mockSecret, {
        algorithm: 'HS256',
      })

      const result = await validateAdToken(incompleteToken, testFingerprint)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Fingerprint mismatch')
    })

    it('should handle tokens with null fingerprint in payload', async () => {
      const nullFingerprintPayload = {
        type: 'ad_completion',
        fingerprint: null,
        nonce: 'test-nonce',
        jti: 'test-jti',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300,
      }

      const nullFingerprintToken = jwt.sign(
        nullFingerprintPayload,
        mockSecret,
        {
          algorithm: 'HS256',
        },
      )

      const result = await validateAdToken(
        nullFingerprintToken,
        testFingerprint,
      )

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Fingerprint mismatch')
    })

    it('should handle tokens with missing nonce', async () => {
      const missingNoncePayload = {
        type: 'ad_completion',
        fingerprint: testFingerprint,
        // Missing nonce
        jti: 'test-jti',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300,
      }

      const missingNonceToken = jwt.sign(missingNoncePayload, mockSecret, {
        algorithm: 'HS256',
      })

      mockCache.get
        .mockResolvedValueOnce(null) // Token not used
        .mockResolvedValueOnce(testFingerprint) // Token in valid cache

      const result = await validateAdToken(missingNonceToken, testFingerprint)

      expect(result.valid).toBe(true) // Should still be valid without nonce
    })

    it('should handle tokens with missing jti', async () => {
      const missingJtiPayload = {
        type: 'ad_completion',
        fingerprint: testFingerprint,
        nonce: 'test-nonce',
        // Missing jti
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300,
      }

      const missingJtiToken = jwt.sign(missingJtiPayload, mockSecret, {
        algorithm: 'HS256',
      })

      const result = await validateAdToken(missingJtiToken, testFingerprint)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Token not found in valid tokens')
    })

    it('should validate token caching behavior correctly', async () => {
      // First call should check cache and validate
      mockCache.get
        .mockResolvedValueOnce(null) // Token not used
        .mockResolvedValueOnce(testFingerprint) // Token in valid cache

      mockCache.set.mockResolvedValue(undefined)
      mockCache.delete.mockResolvedValue(undefined)

      const result1 = await validateAdToken(validToken, testFingerprint)
      expect(result1.valid).toBe(true)

      // Second call should find token already used
      mockCache.get.mockResolvedValueOnce('used') // Token already used

      const result2 = await validateAdToken(validToken, testFingerprint)
      expect(result2.valid).toBe(false)
      expect(result2.reason).toBe('Token already used')
    })

    it('should handle concurrent validation attempts', async () => {
      // In a real concurrent scenario, tokens would be subject to replay protection
      // Mock cache to simulate this behavior
      mockCache.get
        .mockResolvedValueOnce(null) // First call: not used yet
        .mockResolvedValueOnce(testFingerprint) // First call: valid token exists
        .mockResolvedValueOnce('used') // Second call: already used
        .mockResolvedValueOnce(null) // Second call: valid token no longer exists

      mockCache.set.mockResolvedValue(undefined)
      mockCache.delete.mockResolvedValue(undefined)

      const promise1 = validateAdToken(validToken, testFingerprint)
      const promise2 = validateAdToken(validToken, testFingerprint)

      const [result1, result2] = await Promise.all([promise1, promise2])

      // Both should fail due to security measures
      expect(result1.valid).toBe(false)
      expect(result2.valid).toBe(false)
    })
  })
})
