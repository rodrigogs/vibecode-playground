/**
 * The CacheAdapter interface describes the contract
 * that any cache adapter must fulfill.
 */
export interface CacheAdapter {
  /**
   * Stores a value with the given key in the cache.
   * Optionally takes a time-to-live (ttl) in milliseconds.
   */
  set(key: string, value: unknown, ttl?: number): Promise<void>

  /**
   * Retrieves a value from the cache by key.
   * Returns undefined if key is not found or expired.
   */
  get<T = unknown>(key: string): Promise<T | undefined>

  /**
   * Deletes an entry from the cache by key.
   * Returns true if the entry existed and was removed, false otherwise.
   */
  delete(key: string): Promise<boolean>

  /**
   * Flushes/clears the cache for the given key.
   */
  flush(): Promise<void>

  /**
   * Retrieves all keys matching a given pattern.
   * Returns an array of keys.
   */
  keys(pattern: string): Promise<string[]>
}
