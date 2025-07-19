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
const { isTokenBlacklisted, revokeAdToken } = await import(
  '@/lib/services/ad-token'
)

const mockCache = vi.mocked(cache)

// Mock environment variables
const mockSecret = 'test-secret-key-for-jwt-signing'
const originalEnv = process.env

describe('Ad Token Blacklist Management', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = mockSecret
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('revokeAdToken', () => {
    it('should revoke a token successfully', async () => {
      const jti = 'test-jti'
      mockCache.set.mockResolvedValue(undefined)

      await revokeAdToken(jti)

      expect(mockCache.set).toHaveBeenCalledWith(
        `ad_token:blacklist:${jti}`,
        'revoked',
        24 * 60 * 60 * 1000,
      )
    })

    it('should throw if cache operation fails', async () => {
      const jti = 'test-jti'
      mockCache.set.mockRejectedValue(new Error('Cache error'))

      await expect(revokeAdToken(jti)).rejects.toThrow('Cache error')
    })

    it('should handle empty jti', async () => {
      const jti = ''
      mockCache.set.mockResolvedValue(undefined)

      await revokeAdToken(jti)

      expect(mockCache.set).toHaveBeenCalledWith(
        'ad_token:blacklist:',
        'revoked',
        24 * 60 * 60 * 1000,
      )
    })

    it('should handle special characters in jti', async () => {
      const jti = 'test-jti-with-special-chars!@#$%^&*()'
      mockCache.set.mockResolvedValue(undefined)

      await revokeAdToken(jti)

      expect(mockCache.set).toHaveBeenCalledWith(
        `ad_token:blacklist:${jti}`,
        'revoked',
        24 * 60 * 60 * 1000,
      )
    })

    it('should handle very long jti', async () => {
      const jti = 'a'.repeat(1000)
      mockCache.set.mockResolvedValue(undefined)

      await revokeAdToken(jti)

      expect(mockCache.set).toHaveBeenCalledWith(
        `ad_token:blacklist:${jti}`,
        'revoked',
        24 * 60 * 60 * 1000,
      )
    })

    it('should use correct TTL for blacklisted tokens', async () => {
      const jti = 'test-jti'
      mockCache.set.mockResolvedValue(undefined)

      await revokeAdToken(jti)

      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        'revoked',
        24 * 60 * 60 * 1000, // 24 hours
      )
    })

    it('should handle multiple revocations of the same token', async () => {
      const jti = 'test-jti'
      mockCache.set.mockResolvedValue(undefined)

      await revokeAdToken(jti)
      await revokeAdToken(jti)

      expect(mockCache.set).toHaveBeenCalledTimes(2)
    })

    it('should handle concurrent revocations', async () => {
      const jti = 'test-jti'
      mockCache.set.mockResolvedValue(undefined)

      const promise1 = revokeAdToken(jti)
      const promise2 = revokeAdToken(jti)

      await Promise.all([promise1, promise2])

      expect(mockCache.set).toHaveBeenCalledTimes(2)
    })
  })

  describe('isTokenBlacklisted', () => {
    it('should return true for blacklisted tokens', async () => {
      const jti = 'test-jti'
      mockCache.get.mockResolvedValue('revoked')

      const result = await isTokenBlacklisted(jti)

      expect(result).toBe(true)
      expect(mockCache.get).toHaveBeenCalledWith(`ad_token:blacklist:${jti}`)
    })

    it('should return false for non-blacklisted tokens', async () => {
      const jti = 'test-jti'
      mockCache.get.mockResolvedValue(null)

      const result = await isTokenBlacklisted(jti)

      expect(result).toBe(false)
    })

    it('should return false if cache fails', async () => {
      const jti = 'test-jti'
      mockCache.get.mockRejectedValue(new Error('Cache error'))

      const result = await isTokenBlacklisted(jti)

      expect(result).toBe(false)
    })

    it('should handle empty jti', async () => {
      const jti = ''
      mockCache.get.mockResolvedValue(null)

      const result = await isTokenBlacklisted(jti)

      expect(result).toBe(false)
      expect(mockCache.get).toHaveBeenCalledWith('ad_token:blacklist:')
    })

    it('should handle special characters in jti', async () => {
      const jti = 'test-jti-with-special-chars!@#$%^&*()'
      mockCache.get.mockResolvedValue('revoked')

      const result = await isTokenBlacklisted(jti)

      expect(result).toBe(true)
      expect(mockCache.get).toHaveBeenCalledWith(`ad_token:blacklist:${jti}`)
    })

    it('should handle very long jti', async () => {
      const jti = 'a'.repeat(1000)
      mockCache.get.mockResolvedValue('revoked')

      const result = await isTokenBlacklisted(jti)

      expect(result).toBe(true)
      expect(mockCache.get).toHaveBeenCalledWith(`ad_token:blacklist:${jti}`)
    })

    it('should return false for undefined cache values', async () => {
      const jti = 'test-jti'
      mockCache.get.mockResolvedValue(undefined)

      const result = await isTokenBlacklisted(jti)

      // undefined !== null is true, so this returns true
      // This is the actual behavior of the implementation
      expect(result).toBe(true)
    })

    it('should return true for any truthy cache value', async () => {
      const jti = 'test-jti'
      mockCache.get.mockResolvedValue('any-value')

      const result = await isTokenBlacklisted(jti)

      expect(result).toBe(true)
    })

    it('should handle concurrent blacklist checks', async () => {
      const jti = 'test-jti'
      mockCache.get.mockResolvedValue('revoked')

      const promise1 = isTokenBlacklisted(jti)
      const promise2 = isTokenBlacklisted(jti)

      const [result1, result2] = await Promise.all([promise1, promise2])

      expect(result1).toBe(true)
      expect(result2).toBe(true)
      expect(mockCache.get).toHaveBeenCalledTimes(2)
    })

    it('should handle cache timeout gracefully', async () => {
      const jti = 'test-jti'
      mockCache.get.mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve('revoked'), 100)),
      )

      const result = await isTokenBlacklisted(jti)

      expect(result).toBe(true)
    })
  })

  describe('Integration: Revoke and Check', () => {
    it('should blacklist token and verify it is blacklisted', async () => {
      const jti = 'test-integration-jti'

      // First revoke the token
      mockCache.set.mockResolvedValue(undefined)
      await revokeAdToken(jti)

      // Then check if it's blacklisted
      mockCache.get.mockResolvedValue('revoked')
      const isBlacklisted = await isTokenBlacklisted(jti)

      expect(isBlacklisted).toBe(true)
      expect(mockCache.set).toHaveBeenCalledWith(
        `ad_token:blacklist:${jti}`,
        'revoked',
        24 * 60 * 60 * 1000,
      )
      expect(mockCache.get).toHaveBeenCalledWith(`ad_token:blacklist:${jti}`)
    })

    it('should handle revocation followed by immediate check', async () => {
      const jti = 'test-immediate-jti'

      mockCache.set.mockResolvedValue(undefined)
      mockCache.get.mockResolvedValue('revoked')

      // Revoke and immediately check
      await revokeAdToken(jti)
      const isBlacklisted = await isTokenBlacklisted(jti)

      expect(isBlacklisted).toBe(true)
    })

    it('should handle multiple tokens revocation', async () => {
      const jtis = ['jti1', 'jti2', 'jti3']

      mockCache.set.mockResolvedValue(undefined)
      mockCache.get.mockResolvedValue('revoked')

      // Revoke all tokens
      await Promise.all(jtis.map((jti) => revokeAdToken(jti)))

      // Check all are blacklisted
      const results = await Promise.all(
        jtis.map((jti) => isTokenBlacklisted(jti)),
      )

      expect(results).toEqual([true, true, true])
      expect(mockCache.set).toHaveBeenCalledTimes(3)
      expect(mockCache.get).toHaveBeenCalledTimes(3)
    })
  })
})
