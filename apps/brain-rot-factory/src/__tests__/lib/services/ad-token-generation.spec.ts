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
const { generateAdToken } = await import('@/lib/services/ad-token')

const mockCache = vi.mocked(cache)

// Mock environment variables
const mockSecret = 'test-secret-key-for-jwt-signing'
const originalEnv = process.env

describe('Ad Token Generation', () => {
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

  describe('generateAdToken', () => {
    it('should generate a valid JWT token with correct payload', async () => {
      const mockCurrentTime = 1640995200000 // 2022-01-01T00:00:00Z
      vi.setSystemTime(mockCurrentTime)

      mockCache.set.mockResolvedValue(undefined)

      const token = await generateAdToken(testFingerprint)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')

      // Decode token to verify payload
      const decoded = jwt.decode(token) as AdTokenPayload
      expect(decoded.type).toBe('ad_completion')
      expect(decoded.fingerprint).toBe(testFingerprint)
      expect(decoded.nonce).toBeDefined()
      expect(decoded.jti).toBeDefined()
      expect(decoded.iat).toBe(Math.floor(mockCurrentTime / 1000))
      expect(decoded.exp).toBe(Math.floor(mockCurrentTime / 1000) + 300) // 5 minutes

      // Verify token is stored in cache
      expect(mockCache.set).toHaveBeenCalledWith(
        `ad_token:valid:${decoded.jti}`,
        testFingerprint,
        300000,
      )
    })

    it('should generate tokens with unique nonces and JTIs', async () => {
      mockCache.set.mockResolvedValue(undefined)

      const token1 = await generateAdToken(testFingerprint)
      const token2 = await generateAdToken(testFingerprint)

      const decoded1 = jwt.decode(token1) as AdTokenPayload
      const decoded2 = jwt.decode(token2) as AdTokenPayload

      expect(decoded1.nonce).not.toBe(decoded2.nonce)
      expect(decoded1.jti).not.toBe(decoded2.jti)
    })

    it('should generate tokens with 5-minute expiration', async () => {
      const mockCurrentTime = 1640995200000
      vi.setSystemTime(mockCurrentTime)

      mockCache.set.mockResolvedValue(undefined)

      const token = await generateAdToken(testFingerprint)
      const decoded = jwt.decode(token) as AdTokenPayload

      const expectedExp = Math.floor(mockCurrentTime / 1000) + 300 // 5 minutes
      expect(decoded.exp).toBe(expectedExp)
    })

    it('should handle different fingerprints correctly', async () => {
      mockCache.set.mockResolvedValue(undefined)

      const fingerprint1 = 'fingerprint-1'
      const fingerprint2 = 'fingerprint-2'

      const token1 = await generateAdToken(fingerprint1)
      const token2 = await generateAdToken(fingerprint2)

      const decoded1 = jwt.decode(token1) as AdTokenPayload
      const decoded2 = jwt.decode(token2) as AdTokenPayload

      expect(decoded1.fingerprint).toBe(fingerprint1)
      expect(decoded2.fingerprint).toBe(fingerprint2)
    })

    it('should continue if cache storage fails', async () => {
      mockCache.set.mockRejectedValue(new Error('Cache error'))

      const token = await generateAdToken(testFingerprint)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')

      // Should still be a valid JWT
      const decoded = jwt.decode(token) as AdTokenPayload
      expect(decoded.type).toBe('ad_completion')
      expect(decoded.fingerprint).toBe(testFingerprint)
    })

    it('should generate tokens with proper JWT structure', async () => {
      mockCache.set.mockResolvedValue(undefined)

      const token = await generateAdToken(testFingerprint)

      // Token should have 3 parts separated by dots
      const parts = token.split('.')
      expect(parts).toHaveLength(3)

      // Each part should be base64url encoded
      expect(parts[0]).toMatch(/^[A-Za-z0-9_-]+$/)
      expect(parts[1]).toMatch(/^[A-Za-z0-9_-]+$/)
      expect(parts[2]).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it('should create tokens that can be verified with the correct secret', async () => {
      mockCache.set.mockResolvedValue(undefined)

      const token = await generateAdToken(testFingerprint)

      // Should not throw when verifying with correct secret
      expect(() => {
        jwt.verify(token, mockSecret, { algorithms: ['HS256'] })
      }).not.toThrow()
    })

    it('should create tokens that fail verification with wrong secret', async () => {
      mockCache.set.mockResolvedValue(undefined)

      const token = await generateAdToken(testFingerprint)

      // Should throw when verifying with wrong secret
      expect(() => {
        jwt.verify(token, 'wrong-secret', { algorithms: ['HS256'] })
      }).toThrow()
    })

    it('should handle empty fingerprint input', async () => {
      mockCache.set.mockResolvedValue(undefined)

      const token = await generateAdToken('')

      const decoded = jwt.decode(token) as AdTokenPayload
      expect(decoded.fingerprint).toBe('')
    })

    it('should handle long fingerprint input', async () => {
      const longFingerprint = 'a'.repeat(1000)
      mockCache.set.mockResolvedValue(undefined)

      const token = await generateAdToken(longFingerprint)

      const decoded = jwt.decode(token) as AdTokenPayload
      expect(decoded.fingerprint).toBe(longFingerprint)
    })

    it('should handle special characters in fingerprint', async () => {
      const specialFingerprint = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      mockCache.set.mockResolvedValue(undefined)

      const token = await generateAdToken(specialFingerprint)

      const decoded = jwt.decode(token) as AdTokenPayload
      expect(decoded.fingerprint).toBe(specialFingerprint)
    })

    it('should store token in cache with correct TTL', async () => {
      mockCache.set.mockResolvedValue(undefined)

      const token = await generateAdToken(testFingerprint)
      const decoded = jwt.decode(token) as AdTokenPayload

      expect(mockCache.set).toHaveBeenCalledWith(
        `ad_token:valid:${decoded.jti}`,
        testFingerprint,
        300000, // 5 minutes TTL in milliseconds
      )
    })

    it('should generate nonce with sufficient entropy', async () => {
      mockCache.set.mockResolvedValue(undefined)

      const tokens = await Promise.all([
        generateAdToken(testFingerprint),
        generateAdToken(testFingerprint),
        generateAdToken(testFingerprint),
        generateAdToken(testFingerprint),
        generateAdToken(testFingerprint),
      ])

      const nonces = tokens.map((token) => {
        const decoded = jwt.decode(token) as AdTokenPayload
        return decoded.nonce
      })

      // All nonces should be unique
      const uniqueNonces = new Set(nonces)
      expect(uniqueNonces.size).toBe(nonces.length)

      // Each nonce should be a reasonable length
      nonces.forEach((nonce) => {
        expect(nonce.length).toBeGreaterThan(10)
      })
    })

    it('should generate JTI with sufficient entropy', async () => {
      mockCache.set.mockResolvedValue(undefined)

      const tokens = await Promise.all([
        generateAdToken(testFingerprint),
        generateAdToken(testFingerprint),
        generateAdToken(testFingerprint),
        generateAdToken(testFingerprint),
        generateAdToken(testFingerprint),
      ])

      const jtis = tokens.map((token) => {
        const decoded = jwt.decode(token) as AdTokenPayload
        return decoded.jti
      })

      // All JTIs should be unique
      const uniqueJtis = new Set(jtis)
      expect(uniqueJtis.size).toBe(jtis.length)

      // Each JTI should be a reasonable length
      jtis.forEach((jti) => {
        expect(jti.length).toBeGreaterThan(10)
      })
    })
  })
})
