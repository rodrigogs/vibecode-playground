/**
 * Burst Rate Limiting System Tests
 *
 * Comprehensive test suite for the burst rate limiting functionality
 * covering all security scenarios and edge cases.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cache } from '@/lib/backend-cache'
import {
  BURST_LIMITS,
  type BurstLimitResult,
  type BurstTrackingData,
  checkBurstRateLimit,
  getBurstRateLimitStatus,
  resetBurstRateLimit,
} from '@/lib/utils/burst-rate-limit'

// Mock cache
vi.mock('@/lib/backend-cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock cache keys
vi.mock('@/lib/utils/cache-keys', () => ({
  cacheKeys: {
    rateLimit: {
      burst: vi.fn(
        (identifier: string, method: string) => `burst:${method}:${identifier}`,
      ),
    },
  },
}))

// Get reference to mocked cache
const mockCache = vi.mocked(cache)

// Mock cache keys
vi.mock('@/lib/utils/cache-keys', () => ({
  cacheKeys: {
    rateLimit: {
      burst: vi.fn(
        (identifier: string, method: string) => `burst:${method}:${identifier}`,
      ),
    },
  },
}))

// Test helpers
function createBurstTrackingData(
  timestamps: number[] = [],
  suspiciousFlags: string[] = [],
  consecutiveViolations = 0,
): BurstTrackingData {
  return {
    timestamps,
    lastCleanup: Date.now(),
    suspiciousFlags,
    consecutiveViolations,
  }
}

function advanceTime(ms: number) {
  const currentTime = Date.now()
  vi.setSystemTime(currentTime + ms)
}

describe('Burst Rate Limiting System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
  })

  describe('BURST_LIMITS Configuration', () => {
    it('should have correct time windows and request limits', () => {
      expect(BURST_LIMITS.SHORT_WINDOW.duration).toBe(10000) // 10 seconds
      expect(BURST_LIMITS.SHORT_WINDOW.maxRequests).toBe(5)

      expect(BURST_LIMITS.MEDIUM_WINDOW.duration).toBe(60000) // 1 minute
      expect(BURST_LIMITS.MEDIUM_WINDOW.maxRequests).toBe(15)

      expect(BURST_LIMITS.LONG_WINDOW.duration).toBe(300000) // 5 minutes
      expect(BURST_LIMITS.LONG_WINDOW.maxRequests).toBe(40)
    })

    it('should have appropriate cleanup interval', () => {
      expect(BURST_LIMITS.CLEANUP_INTERVAL).toBe(60000) // 1 minute
    })
  })

  describe('checkBurstRateLimit', () => {
    describe('First-time requests', () => {
      it('should allow first request for new identifier', async () => {
        mockCache.get.mockResolvedValue(null)
        mockCache.set.mockResolvedValue(undefined)

        const result = await checkBurstRateLimit('192.168.1.1', 'ip')

        expect(result.allowed).toBe(true)
        expect(result.burstLevel).toBe('none')
        expect(result.windowsViolated).toHaveLength(0)
        expect(result.suspiciousActivity).toBe(false)
        expect(result.requestsInWindows.short).toBe(0)
        expect(result.requestsInWindows.medium).toBe(0)
        expect(result.requestsInWindows.long).toBe(0)
      })

      it('should create initial tracking data for new identifier', async () => {
        mockCache.get.mockResolvedValue(null)
        mockCache.set.mockResolvedValue(undefined)

        await checkBurstRateLimit('192.168.1.1', 'ip')

        expect(mockCache.set).toHaveBeenCalledWith(
          'burst:ip:192.168.1.1',
          expect.objectContaining({
            timestamps: [Date.now()],
            consecutiveViolations: 0,
            suspiciousFlags: [],
          }),
          360000, // LONG_WINDOW + CLEANUP_INTERVAL
        )
      })
    })

    describe('Short window burst protection (10 seconds)', () => {
      it('should allow requests within short window limit', async () => {
        const currentTime = Date.now()
        const timestamps = [
          currentTime - 8000, // 8 seconds ago
          currentTime - 5000, // 5 seconds ago
          currentTime - 2000, // 2 seconds ago
        ] // 3 requests in last 10 seconds

        mockCache.get.mockResolvedValue(createBurstTrackingData(timestamps))
        mockCache.set.mockResolvedValue(undefined)

        const result = await checkBurstRateLimit('192.168.1.1', 'ip')

        expect(result.allowed).toBe(true)
        expect(result.requestsInWindows.short).toBe(3)
        expect(result.windowsViolated).not.toContain('short')
      })

      it('should block requests exceeding short window limit', async () => {
        const currentTime = Date.now()
        const timestamps = [
          currentTime - 9000, // 9 seconds ago
          currentTime - 7000, // 7 seconds ago
          currentTime - 5000, // 5 seconds ago
          currentTime - 3000, // 3 seconds ago
          currentTime - 1000, // 1 second ago
        ] // 5 requests in last 10 seconds (at limit)

        mockCache.get.mockResolvedValue(createBurstTrackingData(timestamps))
        mockCache.set.mockResolvedValue(undefined)

        const result = await checkBurstRateLimit('192.168.1.1', 'ip')

        expect(result.allowed).toBe(false)
        expect(result.requestsInWindows.short).toBe(5)
        expect(result.windowsViolated).toContain('short')
        expect(result.nextAllowedTime).toBeDefined()
      })

      it('should calculate correct next allowed time for short window', async () => {
        const currentTime = Date.now()
        const oldestRequestTime = currentTime - 9000 // 9 seconds ago
        const timestamps = [
          oldestRequestTime,
          currentTime - 7000,
          currentTime - 5000,
          currentTime - 3000,
          currentTime - 1000,
        ]

        mockCache.get.mockResolvedValue(createBurstTrackingData(timestamps))
        mockCache.set.mockResolvedValue(undefined)

        const result = await checkBurstRateLimit('192.168.1.1', 'ip')

        expect(result.allowed).toBe(false)
        expect(result.nextAllowedTime).toBe(
          oldestRequestTime + BURST_LIMITS.SHORT_WINDOW.duration + 1,
        )
      })
    })

    describe('Medium window burst protection (1 minute)', () => {
      it('should allow requests within medium window limit', async () => {
        const currentTime = Date.now()
        const timestamps = Array.from(
          { length: 10 },
          (_, i) => currentTime - i * 5000, // 10 requests over 50 seconds
        )

        mockCache.get.mockResolvedValue(createBurstTrackingData(timestamps))
        mockCache.set.mockResolvedValue(undefined)

        const result = await checkBurstRateLimit('192.168.1.1', 'ip')

        expect(result.allowed).toBe(true)
        expect(result.requestsInWindows.medium).toBe(10)
        expect(result.windowsViolated).not.toContain('medium')
      })

      it('should block requests exceeding medium window limit', async () => {
        const currentTime = Date.now()
        const timestamps = Array.from(
          { length: 15 },
          (_, i) => currentTime - i * 3000, // 15 requests over 45 seconds
        )

        mockCache.get.mockResolvedValue(createBurstTrackingData(timestamps))
        mockCache.set.mockResolvedValue(undefined)

        const result = await checkBurstRateLimit('192.168.1.1', 'ip')

        expect(result.allowed).toBe(false)
        expect(result.requestsInWindows.medium).toBe(15)
        expect(result.windowsViolated).toContain('medium')
      })
    })

    describe('Long window burst protection (5 minutes)', () => {
      it('should allow requests within long window limit', async () => {
        const currentTime = Date.now()
        const timestamps = Array.from(
          { length: 30 },
          (_, i) => currentTime - i * 9000, // 30 requests over 4.5 minutes
        )

        mockCache.get.mockResolvedValue(createBurstTrackingData(timestamps))
        mockCache.set.mockResolvedValue(undefined)

        const result = await checkBurstRateLimit('192.168.1.1', 'ip')

        expect(result.allowed).toBe(true)
        expect(result.requestsInWindows.long).toBe(30)
        expect(result.windowsViolated).not.toContain('long')
      })

      it('should block requests exceeding long window limit', async () => {
        const currentTime = Date.now()
        const timestamps = Array.from(
          { length: 40 },
          (_, i) => currentTime - i * 7000, // 40 requests over ~4.6 minutes
        )

        mockCache.get.mockResolvedValue(createBurstTrackingData(timestamps))
        mockCache.set.mockResolvedValue(undefined)

        const result = await checkBurstRateLimit('192.168.1.1', 'ip')

        expect(result.allowed).toBe(false)
        expect(result.requestsInWindows.long).toBe(40)
        expect(result.windowsViolated).toContain('long')
      })
    })

    describe('Multiple window violations', () => {
      it('should detect violations across multiple windows', async () => {
        const currentTime = Date.now()
        // Create a scenario where short and medium windows are violated
        const timestamps = [
          // Recent burst (violates short window)
          currentTime - 1000,
          currentTime - 2000,
          currentTime - 3000,
          currentTime - 4000,
          currentTime - 5000,
          // More requests in medium window
          ...Array.from(
            { length: 12 },
            (_, i) => currentTime - (10000 + i * 3000),
          ),
        ]

        mockCache.get.mockResolvedValue(createBurstTrackingData(timestamps))
        mockCache.set.mockResolvedValue(undefined)

        const result = await checkBurstRateLimit('192.168.1.1', 'ip')

        expect(result.allowed).toBe(false)
        expect(result.windowsViolated).toContain('short')
        expect(result.windowsViolated).toContain('medium')
        expect(result.windowsViolated.length).toBeGreaterThan(1)
      })
    })

    describe('Suspicious activity detection', () => {
      it('should detect rapid succession requests', async () => {
        const currentTime = Date.now()
        const timestamps = [
          currentTime - 100, // 100ms ago
          currentTime - 200, // 200ms ago
          currentTime - 300, // 300ms ago
        ] // Very rapid requests

        mockCache.get.mockResolvedValue(createBurstTrackingData(timestamps))
        mockCache.set.mockResolvedValue(undefined)

        const result = await checkBurstRateLimit('192.168.1.1', 'ip')

        expect(result.suspiciousActivity).toBe(true)
        expect(result.burstLevel).toBe('medium')
      })

      it('should detect persistent burst attempts', async () => {
        const data = createBurstTrackingData([], [], 5) // 5 consecutive violations
        mockCache.get.mockResolvedValue(data)
        mockCache.set.mockResolvedValue(undefined)

        const result = await checkBurstRateLimit('192.168.1.1', 'ip')

        expect(result.suspiciousActivity).toBe(true)
        expect(result.burstLevel).toBe('high')
      })

      it('should detect extreme burst patterns', async () => {
        const currentTime = Date.now()
        const timestamps = Array.from(
          { length: 10 },
          (_, i) => currentTime - i * 400, // 10 requests in 4 seconds
        )

        mockCache.get.mockResolvedValue(createBurstTrackingData(timestamps))
        mockCache.set.mockResolvedValue(undefined)

        const result = await checkBurstRateLimit('192.168.1.1', 'ip')

        expect(result.suspiciousActivity).toBe(true)
        expect(result.burstLevel).toBe('critical')
      })

      it('should detect automated regular intervals', async () => {
        const currentTime = Date.now()
        const timestamps = [
          currentTime - 1000, // Exactly 1 second intervals
          currentTime - 2000,
          currentTime - 3000,
          currentTime - 4000,
        ]

        mockCache.get.mockResolvedValue(createBurstTrackingData(timestamps))
        mockCache.set.mockResolvedValue(undefined)

        const result = await checkBurstRateLimit('192.168.1.1', 'ip')

        expect(result.suspiciousActivity).toBe(true)
        expect(result.burstLevel).toBe('medium') // Updated: automated patterns now trigger medium level
      })
    })

    describe('Timestamp cleanup', () => {
      it('should clean up expired timestamps', async () => {
        const currentTime = Date.now()
        const expiredTimestamps = [
          currentTime - 400000, // 6+ minutes ago (expired)
          currentTime - 350000, // 5+ minutes ago (expired)
        ]
        const validTimestamps = [
          currentTime - 100000, // 1.6 minutes ago (valid)
          currentTime - 50000, // 50 seconds ago (valid)
        ]

        const data = createBurstTrackingData([
          ...expiredTimestamps,
          ...validTimestamps,
        ])
        data.lastCleanup = currentTime - BURST_LIMITS.CLEANUP_INTERVAL - 1000 // Trigger cleanup

        mockCache.get.mockResolvedValue(data)
        mockCache.set.mockResolvedValue(undefined)

        await checkBurstRateLimit('192.168.1.1', 'ip')

        // Verify that set was called with cleaned data
        expect(mockCache.set).toHaveBeenCalledWith(
          'burst:ip:192.168.1.1',
          expect.objectContaining({
            timestamps: expect.arrayContaining(validTimestamps),
          }),
          expect.any(Number),
        )

        // Verify that expired timestamps were removed
        const setCall = mockCache.set.mock.calls[0][1]
        expect(setCall.timestamps).not.toContain(expiredTimestamps[0])
        expect(setCall.timestamps).not.toContain(expiredTimestamps[1])
      })

      it('should reset consecutive violations after enough time passes', async () => {
        const currentTime = Date.now()

        const data = createBurstTrackingData([], [], 3) // 3 consecutive violations
        data.lastCleanup = currentTime - BURST_LIMITS.CLEANUP_INTERVAL - 1000

        mockCache.get.mockResolvedValue(data)
        mockCache.set.mockResolvedValue(undefined)

        await checkBurstRateLimit('192.168.1.1', 'ip')

        expect(mockCache.set).toHaveBeenCalledWith(
          'burst:ip:192.168.1.1',
          expect.objectContaining({
            consecutiveViolations: 0,
            suspiciousFlags: [],
          }),
          expect.any(Number),
        )
      })
    })

    describe('Error handling', () => {
      it('should handle cache errors gracefully', async () => {
        mockCache.get.mockRejectedValue(new Error('Cache error'))

        const result = await checkBurstRateLimit('192.168.1.1', 'ip')

        expect(result.allowed).toBe(true) // Should allow on error
        expect(result.burstLevel).toBe('none')
        expect(result.suspiciousActivity).toBe(false)
      })

      it('should handle cache set errors gracefully', async () => {
        mockCache.get.mockResolvedValue(null)
        mockCache.set.mockRejectedValue(new Error('Cache set error'))

        const result = await checkBurstRateLimit('192.168.1.1', 'ip')

        expect(result.allowed).toBe(true) // Should still work
        expect(result.burstLevel).toBe('none')
      })
    })

    describe('Different identifier methods', () => {
      it('should work with fingerprint method', async () => {
        mockCache.get.mockResolvedValue(null)
        mockCache.set.mockResolvedValue(undefined)

        const result = await checkBurstRateLimit(
          'fingerprint123',
          'fingerprint',
        )

        expect(result.allowed).toBe(true)
        expect(mockCache.set).toHaveBeenCalledWith(
          'burst:fingerprint:fingerprint123',
          expect.any(Object),
          expect.any(Number),
        )
      })

      it('should work with combined method', async () => {
        mockCache.get.mockResolvedValue(null)
        mockCache.set.mockResolvedValue(undefined)

        const result = await checkBurstRateLimit(
          '192.168.1.1:fingerprint123',
          'combined',
        )

        expect(result.allowed).toBe(true)
        expect(mockCache.set).toHaveBeenCalledWith(
          'burst:combined:192.168.1.1:fingerprint123',
          expect.any(Object),
          expect.any(Number),
        )
      })

      it('should work with user method', async () => {
        mockCache.get.mockResolvedValue(null)
        mockCache.set.mockResolvedValue(undefined)

        const result = await checkBurstRateLimit('user123', 'user')

        expect(result.allowed).toBe(true)
        expect(mockCache.set).toHaveBeenCalledWith(
          'burst:user:user123',
          expect.any(Object),
          expect.any(Number),
        )
      })
    })
  })

  describe('resetBurstRateLimit', () => {
    it('should successfully reset burst data', async () => {
      mockCache.delete.mockResolvedValue(true)

      const result = await resetBurstRateLimit('192.168.1.1', 'ip')

      expect(result).toBe(true)
      expect(mockCache.delete).toHaveBeenCalledWith('burst:ip:192.168.1.1')
    })

    it('should handle delete errors gracefully', async () => {
      mockCache.delete.mockRejectedValue(new Error('Delete error'))

      const result = await resetBurstRateLimit('192.168.1.1', 'ip')

      expect(result).toBe(false)
    })

    it('should work with different methods', async () => {
      mockCache.delete.mockResolvedValue(true)

      await resetBurstRateLimit('user123', 'user')
      expect(mockCache.delete).toHaveBeenCalledWith('burst:user:user123')

      await resetBurstRateLimit('fingerprint123', 'fingerprint')
      expect(mockCache.delete).toHaveBeenCalledWith(
        'burst:fingerprint:fingerprint123',
      )
    })
  })

  describe('getBurstRateLimitStatus', () => {
    it('should return status for existing data', async () => {
      const currentTime = Date.now()
      const timestamps = [
        currentTime - 5000, // 5 seconds ago (within 10s window)
        currentTime - 8000, // 8 seconds ago (within 10s window)
        currentTime - 30000, // 30 seconds ago (outside 10s window)
      ]

      const data = createBurstTrackingData(timestamps)
      mockCache.get.mockResolvedValue(data)

      const result = await getBurstRateLimitStatus('192.168.1.1', 'ip')

      expect(result.data).toEqual(data)
      expect(result.requestsInWindows.short).toBe(2) // 2 requests in last 10 seconds (5s and 8s ago)
      expect(result.requestsInWindows.medium).toBe(3) // 3 requests in last minute
      expect(result.requestsInWindows.long).toBe(3) // 3 requests in last 5 minutes
      expect(result.wouldBeAllowed).toBe(true)
    })

    it('should return empty status for non-existent data', async () => {
      mockCache.get.mockResolvedValue(null)

      const result = await getBurstRateLimitStatus('192.168.1.1', 'ip')

      expect(result.data).toBeNull()
      expect(result.requestsInWindows.short).toBe(0)
      expect(result.requestsInWindows.medium).toBe(0)
      expect(result.requestsInWindows.long).toBe(0)
      expect(result.wouldBeAllowed).toBe(true)
    })

    it('should correctly calculate would-be-allowed status', async () => {
      const currentTime = Date.now()
      const timestamps = Array.from(
        { length: 6 },
        (_, i) => currentTime - i * 1000, // 6 requests in last 6 seconds (violates short window)
      )

      const data = createBurstTrackingData(timestamps)
      mockCache.get.mockResolvedValue(data)

      const result = await getBurstRateLimitStatus('192.168.1.1', 'ip')

      expect(result.wouldBeAllowed).toBe(false)
      expect(result.requestsInWindows.short).toBeGreaterThan(
        BURST_LIMITS.SHORT_WINDOW.maxRequests,
      )
    })

    it('should handle errors gracefully', async () => {
      mockCache.get.mockRejectedValue(new Error('Get error'))

      const result = await getBurstRateLimitStatus('192.168.1.1', 'ip')

      expect(result.data).toBeNull()
      expect(result.wouldBeAllowed).toBe(true)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle realistic burst attack scenario', async () => {
      // Simulate a burst attack: many requests in quick succession
      const results: BurstLimitResult[] = []

      for (let i = 0; i < 10; i++) {
        // Mock fresh cache state for each request
        if (i === 0) {
          mockCache.get.mockResolvedValue(null)
        } else {
          const timestamps = Array.from(
            { length: i },
            (_, j) => Date.now() - j * 500,
          )
          mockCache.get.mockResolvedValue(createBurstTrackingData(timestamps))
        }

        mockCache.set.mockResolvedValue(undefined)

        const result = await checkBurstRateLimit('attacker-ip', 'ip')
        results.push(result)

        // Advance time slightly
        advanceTime(500)
      }

      // First few requests should be allowed
      expect(results[0].allowed).toBe(true)
      expect(results[1].allowed).toBe(true)
      expect(results[2].allowed).toBe(true)

      // Should start blocking after short window limit
      const blockedResults = results.filter((r) => !r.allowed)
      expect(blockedResults.length).toBeGreaterThan(0)

      // Should detect suspicious activity
      const suspiciousResults = results.filter((r) => r.suspiciousActivity)
      expect(suspiciousResults.length).toBeGreaterThan(0)
    })

    it('should handle normal user behavior correctly', async () => {
      // Simulate normal user: occasional requests with very irregular intervals
      // that won't trigger any burst detection
      const results: BurstLimitResult[] = []

      // Use very sparse, irregular intervals (like real user behavior)
      const timestamps = [
        Date.now() - 300000, // 5 minutes ago
        Date.now() - 180000, // 3 minutes ago
        Date.now() - 120000, // 2 minutes ago
        Date.now() - 45000, // 45 seconds ago
      ]

      for (let i = 0; i < 5; i++) {
        if (i === 0) {
          mockCache.get.mockResolvedValue(null)
        } else {
          // Use the pre-defined sparse timestamps
          const relevantTimestamps = timestamps.slice(0, i)
          mockCache.get.mockResolvedValue(
            createBurstTrackingData(relevantTimestamps),
          )
        }

        mockCache.set.mockResolvedValue(undefined)

        const result = await checkBurstRateLimit('normal-user', 'ip')
        results.push(result)

        // Advance time by 45+ seconds to ensure no rapid succession
        advanceTime(45000 + Math.random() * 30000) // 45-75 seconds
      }

      // All requests should be allowed for normal user with very sparse timing
      results.forEach((result) => {
        expect(result.allowed).toBe(true)
        expect(result.suspiciousActivity).toBe(false)
        expect(result.burstLevel).toBe('none')
      })
    })
  })
})
