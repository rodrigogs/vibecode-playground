import type { CacheAdapter } from './cache-adapter.js'

/**
 * Cache class wraps around any CacheAdapter implementation.
 * You can replace the adapter at runtime if needed.
 */
export class Cache {
  private adapter: CacheAdapter

  constructor(adapter: CacheAdapter) {
    this.adapter = adapter
  }

  public async set(key: string, value: unknown, ttl?: number): Promise<void> {
    await this.adapter.set(key, value, ttl)
  }

  public async get<T>(key: string): Promise<T | undefined> {
    return this.adapter.get<T>(key)
  }

  public async delete(key: string): Promise<boolean> {
    return this.adapter.delete(key)
  }

  public async flush(): Promise<void> {
    await this.adapter.flush()
  }

  public async keys(pattern: string): Promise<string[]> {
    return this.adapter.keys(pattern)
  }

  public async has(key: string): Promise<boolean> {
    return this.keys(key).then((keys) => keys.length > 0)
  }
}
