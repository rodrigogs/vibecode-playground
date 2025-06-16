import outmatch from 'outmatch'

import type { CacheAdapter } from '../cache-adapter.js'

interface CachedValue {
  value: unknown
  expiresAt?: number // store expiration in epoch ms
}

export class MemoryCacheAdapter implements CacheAdapter {
  private store = new Map<string, CachedValue>()

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const expiresAt = ttl ? Date.now() + ttl : undefined
    this.store.set(key, { value, expiresAt })
  }

  async get<T>(key: string): Promise<T | undefined> {
    const cached = this.store.get(key)
    if (!cached) {
      return undefined
    }

    if (cached.expiresAt && Date.now() > cached.expiresAt) {
      // If expired, remove it from store and return undefined
      this.store.delete(key)
      return undefined
    }

    return cached.value as T
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key)
  }

  async flush(): Promise<void> {
    this.store.clear()
  }

  async keys(pattern: string): Promise<string[]> {
    const keys = Array.from(this.store.keys())

    // If no pattern or wildcard, return all keys
    if (!pattern || pattern === '*') {
      return keys
    }

    // Create a matcher from the pattern
    const isMatch = outmatch(pattern)
    return keys.filter(isMatch)
  }
}
