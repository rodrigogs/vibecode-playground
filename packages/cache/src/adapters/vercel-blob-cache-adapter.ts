import { del, head, list, put } from '@vercel/blob'
import outmatch from 'outmatch'

import type { CacheAdapter } from '../cache-adapter.js'

interface CacheEntry {
  value: unknown
  expiresAt?: number
}

interface VercelBlobCacheAdapterOptions {
  /**
   * Token for Vercel Blob operations.
   * Defaults to process.env.BLOB_READ_WRITE_TOKEN
   */
  token?: string
  /**
   * Prefix to add to all cache keys to avoid conflicts.
   * Defaults to 'cache/'
   */
  prefix?: string
  /**
   * Default TTL in milliseconds for cache entries.
   * If not provided, entries won't expire automatically.
   */
  defaultTtl?: number
  /**
   * Whether to add random suffix to blob names to avoid conflicts.
   * Defaults to false for predictable cache keys.
   */
  addRandomSuffix?: boolean
}

/**
 * Vercel Blob cache adapter that stores cache entries as JSON blobs.
 *
 * This adapter leverages Vercel Blob storage for persistent caching
 * across serverless function invocations. Cache values are serialized
 * to JSON and stored as blobs with metadata for expiration.
 *
 * Note: This adapter is best suited for larger cache values or when
 * you need persistent caching across deployments. For small, frequent
 * cache operations, consider using memory or Redis adapters instead
 * due to the network latency of blob operations.
 */
export class VercelBlobCacheAdapter implements CacheAdapter {
  private readonly token?: string
  private readonly prefix: string
  private readonly defaultTtl?: number
  private readonly addRandomSuffix: boolean

  constructor(options: VercelBlobCacheAdapterOptions = {}) {
    this.token = options.token
    this.prefix = options.prefix ?? 'cache/'
    this.defaultTtl = options.defaultTtl
    this.addRandomSuffix = options.addRandomSuffix ?? false
  }

  /**
   * Generates the blob pathname for a cache key
   */
  private getBlobPath(key: string): string {
    // Sanitize key to be blob-safe
    const sanitizedKey = key.replace(/[^a-zA-Z0-9._-]/g, '_')
    return `${this.prefix}${sanitizedKey}.json`
  }

  /**
   * Stores a value with the given key in Vercel Blob storage
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const expiresAt = ttl
      ? Date.now() + ttl
      : this.defaultTtl
        ? Date.now() + this.defaultTtl
        : undefined

    const cacheEntry: CacheEntry = {
      value,
      expiresAt,
    }

    const blobPath = this.getBlobPath(key)
    const jsonData = JSON.stringify(cacheEntry)

    await put(blobPath, jsonData, {
      access: 'public',
      contentType: 'application/json',
      token: this.token,
      addRandomSuffix: this.addRandomSuffix,
      allowOverwrite: true, // Allow updating existing cache entries
    })
  }

  /**
   * Retrieves a value from Vercel Blob storage by key
   */
  async get<T = unknown>(key: string): Promise<T | undefined> {
    try {
      const blobPath = this.getBlobPath(key)

      // First, check if the blob exists and get metadata
      const metadata = await head(blobPath, { token: this.token })

      // Fetch the blob content
      const response = await fetch(metadata.url)

      if (!response.ok) {
        return undefined
      }

      const jsonData = await response.text()
      const cacheEntry: CacheEntry = JSON.parse(jsonData)

      // Check if entry has expired
      if (cacheEntry.expiresAt && Date.now() > cacheEntry.expiresAt) {
        // Entry expired, delete it and return undefined
        await this.delete(key)
        return undefined
      }

      return cacheEntry.value as T
    } catch {
      // If blob doesn't exist or any other error, return undefined
      return undefined
    }
  }

  /**
   * Deletes an entry from Vercel Blob storage by key
   */
  async delete(key: string): Promise<boolean> {
    try {
      const blobPath = this.getBlobPath(key)
      await del(blobPath, { token: this.token })
      return true
    } catch {
      // If blob doesn't exist or deletion fails, return false
      return false
    }
  }

  /**
   * Flushes/clears all cache entries with the configured prefix
   */
  async flush(): Promise<void> {
    try {
      const { blobs } = await list({
        prefix: this.prefix,
        token: this.token,
        limit: 1000, // Max limit per request
      })

      // Delete all blobs with our cache prefix
      if (blobs.length > 0) {
        const blobUrls = blobs.map((blob) => blob.url)
        await del(blobUrls, { token: this.token })
      }

      // Handle pagination if there are more than 1000 entries
      // Note: For production use, you might want to implement
      // more robust pagination handling
    } catch (error) {
      // If flush fails, we can still continue
      console.warn('Failed to flush Vercel Blob cache:', error)
    }
  }

  /**
   * Retrieves all cache keys matching a given pattern
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      const { blobs } = await list({
        prefix: this.prefix,
        token: this.token,
        limit: 1000, // Max limit per request
      })

      // Extract keys from blob pathnames
      const keys = blobs
        .map((blob) => {
          // Remove prefix and .json extension to get original key
          const pathname = blob.pathname
          if (!pathname.startsWith(this.prefix)) return null

          const keyWithExtension = pathname.slice(this.prefix.length)
          if (!keyWithExtension.endsWith('.json')) return null

          return keyWithExtension.slice(0, -5) // Remove .json
        })
        .filter((key): key is string => key !== null)

      // Apply pattern matching if specified
      if (!pattern || pattern === '*') {
        return keys
      }

      const isMatch = outmatch(pattern)
      return keys.filter(isMatch)
    } catch (error) {
      console.warn('Failed to list Vercel Blob cache keys:', error)
      return []
    }
  }
}
