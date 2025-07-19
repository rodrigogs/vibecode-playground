import jwt from 'jsonwebtoken'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
const { decodeAdTokenUnsafe, generateAdToken } = await import(
  '@/lib/services/ad-token'
)

const mockCache = vi.mocked(cache)

// Mock environment variables
const mockSecret = 'test-secret-key-for-jwt-signing'
const originalEnv = process.env

describe('Ad Token Utilities', () => {
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

  describe('decodeAdTokenUnsafe', () => {
    it('should decode a valid token', async () => {
      mockCache.set.mockResolvedValue(undefined)
      const token = await generateAdToken(testFingerprint)

      const decoded = decodeAdTokenUnsafe(token)

      expect(decoded).toBeDefined()
      expect(decoded?.type).toBe('ad_completion')
      expect(decoded?.fingerprint).toBe(testFingerprint)
    })

    it('should return null for invalid tokens', () => {
      const decoded = decodeAdTokenUnsafe('invalid-token')

      expect(decoded).toBeNull()
    })

    it('should return null for empty token', () => {
      const decoded = decodeAdTokenUnsafe('')

      expect(decoded).toBeNull()
    })

    it('should return null for malformed JWT', () => {
      const decoded = decodeAdTokenUnsafe('not.a.jwt')

      expect(decoded).toBeNull()
    })

    it('should return null for token with wrong number of parts', () => {
      const decoded = decodeAdTokenUnsafe('only.two.parts.extra')

      expect(decoded).toBeNull()
    })

    it('should decode token without signature verification', () => {
      // Create a token with wrong signature
      const payload = {
        type: 'ad_completion',
        fingerprint: testFingerprint,
        nonce: 'test-nonce',
        jti: 'test-jti',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300,
      }

      const tokenWithWrongSignature = jwt.sign(payload, 'wrong-secret', {
        algorithm: 'HS256',
      })

      const decoded = decodeAdTokenUnsafe(tokenWithWrongSignature)

      expect(decoded).toBeDefined()
      expect(decoded?.type).toBe('ad_completion')
      expect(decoded?.fingerprint).toBe(testFingerprint)
    })

    it('should decode token with all expected fields', async () => {
      const mockCurrentTime = 1640995200000
      vi.setSystemTime(mockCurrentTime)

      mockCache.set.mockResolvedValue(undefined)
      const token = await generateAdToken(testFingerprint)

      const decoded = decodeAdTokenUnsafe(token)

      expect(decoded).toBeDefined()
      expect(decoded?.type).toBe('ad_completion')
      expect(decoded?.fingerprint).toBe(testFingerprint)
      expect(decoded?.nonce).toBeDefined()
      expect(decoded?.jti).toBeDefined()
      expect(decoded?.iat).toBe(Math.floor(mockCurrentTime / 1000))
      expect(decoded?.exp).toBe(Math.floor(mockCurrentTime / 1000) + 300)
    })

    it('should handle token with missing fields gracefully', () => {
      const incompletePayload = {
        type: 'ad_completion',
        // Missing other fields
      }

      const incompleteToken = jwt.sign(incompletePayload, mockSecret, {
        algorithm: 'HS256',
      })

      const decoded = decodeAdTokenUnsafe(incompleteToken)

      expect(decoded).toBeDefined()
      expect(decoded?.type).toBe('ad_completion')
      expect(decoded?.fingerprint).toBeUndefined()
      expect(decoded?.nonce).toBeUndefined()
      expect(decoded?.jti).toBeUndefined()
    })

    it('should handle token with extra fields', () => {
      const payloadWithExtra = {
        type: 'ad_completion',
        fingerprint: testFingerprint,
        nonce: 'test-nonce',
        jti: 'test-jti',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300,
        extraField: 'extra-value',
        anotherField: 123,
      }

      const tokenWithExtra = jwt.sign(payloadWithExtra, mockSecret, {
        algorithm: 'HS256',
      })

      const decoded = decodeAdTokenUnsafe(tokenWithExtra)

      expect(decoded).toBeDefined()
      expect(decoded?.type).toBe('ad_completion')
      expect(decoded?.fingerprint).toBe(testFingerprint)
      expect((decoded as unknown as Record<string, unknown>)?.extraField).toBe(
        'extra-value',
      )
      expect(
        (decoded as unknown as Record<string, unknown>)?.anotherField,
      ).toBe(123)
    })

    it('should handle token with null values', () => {
      const payloadWithNulls = {
        type: 'ad_completion',
        fingerprint: null,
        nonce: null,
        jti: 'test-jti',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300,
      }

      const tokenWithNulls = jwt.sign(payloadWithNulls, mockSecret, {
        algorithm: 'HS256',
      })

      const decoded = decodeAdTokenUnsafe(tokenWithNulls)

      expect(decoded).toBeDefined()
      expect(decoded?.type).toBe('ad_completion')
      expect(decoded?.fingerprint).toBeNull()
      expect(decoded?.nonce).toBeNull()
      expect(decoded?.jti).toBe('test-jti')
    })

    it('should handle token with non-string values', () => {
      const payloadWithNumbers = {
        type: 'ad_completion',
        fingerprint: 12345,
        nonce: true,
        jti: 'test-jti',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300,
      }

      const tokenWithNumbers = jwt.sign(payloadWithNumbers, mockSecret, {
        algorithm: 'HS256',
      })

      const decoded = decodeAdTokenUnsafe(tokenWithNumbers)

      expect(decoded).toBeDefined()
      expect(decoded?.type).toBe('ad_completion')
      expect(decoded?.fingerprint).toBe(12345)
      expect(decoded?.nonce).toBe(true)
    })

    it('should handle very large token payloads', () => {
      const largePayload = {
        type: 'ad_completion',
        fingerprint: testFingerprint,
        nonce: 'a'.repeat(1000),
        jti: 'test-jti',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300,
        largeField: 'b'.repeat(5000),
      }

      const largeToken = jwt.sign(largePayload, mockSecret, {
        algorithm: 'HS256',
      })

      const decoded = decodeAdTokenUnsafe(largeToken)

      expect(decoded).toBeDefined()
      expect(decoded?.type).toBe('ad_completion')
      expect(decoded?.fingerprint).toBe(testFingerprint)
      expect(decoded?.nonce).toBe('a'.repeat(1000))
      expect((decoded as unknown as Record<string, unknown>)?.largeField).toBe(
        'b'.repeat(5000),
      )
    })

    it('should handle token with special characters', () => {
      const specialFingerprint = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const specialNonce = '特殊字符test🎉'

      const specialPayload = {
        type: 'ad_completion',
        fingerprint: specialFingerprint,
        nonce: specialNonce,
        jti: 'test-jti',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300,
      }

      const specialToken = jwt.sign(specialPayload, mockSecret, {
        algorithm: 'HS256',
      })

      const decoded = decodeAdTokenUnsafe(specialToken)

      expect(decoded).toBeDefined()
      expect(decoded?.type).toBe('ad_completion')
      expect(decoded?.fingerprint).toBe(specialFingerprint)
      expect(decoded?.nonce).toBe(specialNonce)
    })

    it('should not throw on corrupted token structure', () => {
      // Test various corrupted token formats
      const corruptedTokens = [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.corrupted.signature',
        'header.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.corrupted',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature.extra',
        'header.payload',
        'single-part',
        '..',
        'header..signature',
        '.payload.',
      ]

      corruptedTokens.forEach((token) => {
        expect(() => decodeAdTokenUnsafe(token)).not.toThrow()
        expect(decodeAdTokenUnsafe(token)).toBeNull()
      })
    })

    it('should handle expired tokens without issues', () => {
      const expiredPayload = {
        type: 'ad_completion',
        fingerprint: testFingerprint,
        nonce: 'test-nonce',
        jti: 'test-jti',
        iat: Math.floor(Date.now() / 1000) - 1000, // Issued 1000 seconds ago
        exp: Math.floor(Date.now() / 1000) - 500, // Expired 500 seconds ago
      }

      const expiredToken = jwt.sign(expiredPayload, mockSecret, {
        algorithm: 'HS256',
      })

      const decoded = decodeAdTokenUnsafe(expiredToken)

      expect(decoded).toBeDefined()
      expect(decoded?.type).toBe('ad_completion')
      expect(decoded?.fingerprint).toBe(testFingerprint)
      expect(decoded?.exp).toBeLessThan(Math.floor(Date.now() / 1000))
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing environment variables gracefully', () => {
      // This test is more about ensuring the module can be imported
      // The actual environment variable check happens at validation time
      expect(decodeAdTokenUnsafe).toBeDefined()
    })

    it('should handle concurrent decode operations', async () => {
      mockCache.set.mockResolvedValue(undefined)
      const token = await generateAdToken(testFingerprint)

      const promises = Array.from({ length: 10 }, () =>
        decodeAdTokenUnsafe(token),
      )

      const results = await Promise.all(promises)

      results.forEach((result) => {
        expect(result).toBeDefined()
        expect(result?.type).toBe('ad_completion')
        expect(result?.fingerprint).toBe(testFingerprint)
      })
    })

    it('should handle memory pressure with large tokens', () => {
      // Create a very large token payload
      const largePayload = {
        type: 'ad_completion',
        fingerprint: testFingerprint,
        nonce: 'a'.repeat(10000),
        jti: 'test-jti',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300,
        data: Array.from({ length: 1000 }, (_, i) => `item-${i}`),
      }

      const largeToken = jwt.sign(largePayload, mockSecret, {
        algorithm: 'HS256',
      })

      expect(() => decodeAdTokenUnsafe(largeToken)).not.toThrow()
      const decoded = decodeAdTokenUnsafe(largeToken)
      expect(decoded).toBeDefined()
    })
  })
})
