import path from 'node:path'

import type { CacheAdapter } from '@repo/cache'
import { Cache, FsCacheAdapter, MemoryCacheAdapter } from '@repo/cache'

import { config } from '@/lib/config'

const fsCache = new Cache(
  new FsCacheAdapter(path.join(config.DATA_DIR, 'cache')),
)
const memoryCache = new Cache(new MemoryCacheAdapter())

/**
 * CustomAdapter implements a dual-layer caching strategy combining memory and filesystem storage.
 *
 * Features:
 * - Memory cache for fast access with configurable TTL (default: 30 minutes)
 * - Filesystem cache for persistence with configurable TTL (default: 24 hours)
 * - Automatic fallback between cache layers
 * - Graceful error handling - operations continue if one layer fails
 * - Consistent TTL behavior when promoting from filesystem to memory cache
 */
export class CustomAdapter implements CacheAdapter {
  static DEFAULT_MEMORY_TTL = 1000 * 60 * 30 // Expires in 30 minutes by default
  static DEFAULT_FS_TTL = 1000 * 60 * 60 * 24 // Expires in 100 hours (roughly 4 days) by default
  private memoryTtl: number = CustomAdapter.DEFAULT_MEMORY_TTL
  private fsTtl: number = CustomAdapter.DEFAULT_FS_TTL

  constructor(memoryTtl?: number, fsTtl?: number) {
    if (memoryTtl) {
      this.memoryTtl = memoryTtl
    }
    if (fsTtl) {
      this.fsTtl = fsTtl
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    // Use the passed TTL for both layers when explicitly provided,
    // otherwise use the default TTLs for each layer
    const fsTtl = ttl ?? this.fsTtl
    const memoryTtl = ttl ?? this.memoryTtl

    // Execute both operations in parallel for better performance
    // If one fails, the other should still succeed for partial redundancy
    const results = await Promise.allSettled([
      fsCache.set(key, value, fsTtl),
      memoryCache.set(key, value, memoryTtl),
    ])

    // Check if both operations failed - this would be a critical error
    const allFailed = results.every((result) => result.status === 'rejected')
    if (allFailed) {
      const errors = results
        .map((result, index) =>
          result.status === 'rejected'
            ? `${index === 0 ? 'FS' : 'Memory'}: ${result.reason}`
            : null,
        )
        .filter(Boolean)
      throw new Error(`All cache operations failed: ${errors.join(', ')}`)
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    // Try memory cache first
    try {
      const value = await memoryCache.get<T>(key)
      if (value) {
        return value
      }
    } catch {
      // If memory cache fails, continue to filesystem cache
    }

    // Try filesystem cache as fallback
    try {
      const fsValue = await fsCache.get<T>(key)

      if (fsValue) {
        // When copying from filesystem to memory cache, we need to preserve
        // the original TTL context. For rate limiting data, we should use
        // a longer TTL to prevent premature expiration.
        try {
          // Check if this is rate limit data and preserve longer TTL
          const isRateLimitData = key.includes('rate_limit:')
          const promotionTtl = isRateLimitData
            ? Math.max(this.memoryTtl, 4 * 60 * 60 * 1000) // 4 hours minimum for rate limit data
            : this.memoryTtl

          await memoryCache.set(key, fsValue, promotionTtl)
        } catch {
          // If setting in memory cache fails, still return the value
        }
      }

      return fsValue
    } catch {
      // If both caches fail, return undefined
      return undefined
    }
  }

  async delete(key: string): Promise<boolean> {
    const results = await Promise.allSettled([
      fsCache.delete(key),
      memoryCache.delete(key),
    ])

    // Return true if at least one deletion succeeded
    return results.some(
      (result) => result.status === 'fulfilled' && result.value === true,
    )
  }

  async flush(): Promise<void> {
    const results = await Promise.allSettled([
      fsCache.flush(),
      memoryCache.flush(),
    ])

    // Check if both operations failed
    const allFailed = results.every((result) => result.status === 'rejected')
    if (allFailed) {
      const errors = results
        .map((result, index) =>
          result.status === 'rejected'
            ? `${index === 0 ? 'FS' : 'Memory'}: ${result.reason}`
            : null,
        )
        .filter(Boolean)
      throw new Error(`All flush operations failed: ${errors.join(', ')}`)
    }
  }

  async keys(pattern: string): Promise<string[]> {
    const results = await Promise.allSettled([
      fsCache.keys(pattern),
      memoryCache.keys(pattern),
    ])

    const allKeys: string[] = []

    // Collect keys from successful operations
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allKeys.push(...result.value)
      }
    })

    // Return unique keys
    return Array.from(new Set(allKeys))
  }
}

const cache = new Cache(new CustomAdapter())

export { cache }
