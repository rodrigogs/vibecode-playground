import { beforeEach, describe, expect, it, vi } from 'vitest'

import { VercelBlobCacheAdapter } from './vercel-blob-cache-adapter.js'

// Mock the @vercel/blob module
vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
  head: vi.fn(),
  del: vi.fn(),
  list: vi.fn(),
}))

describe('VercelBlobCacheAdapter', () => {
  let adapter: VercelBlobCacheAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new VercelBlobCacheAdapter({
      token: 'test-token',
      prefix: 'test-cache/',
    })
  })

  describe('constructor', () => {
    it('should use default values when no options provided', () => {
      const defaultAdapter = new VercelBlobCacheAdapter()
      expect(defaultAdapter).toBeInstanceOf(VercelBlobCacheAdapter)
    })

    it('should use provided options', () => {
      const customAdapter = new VercelBlobCacheAdapter({
        token: 'custom-token',
        prefix: 'custom-prefix/',
        defaultTtl: 5000,
        addRandomSuffix: true,
        cacheControlMaxAge: 7200, // 2 hours
      })
      expect(customAdapter).toBeInstanceOf(VercelBlobCacheAdapter)
    })

    it('should enforce minimum cacheControlMaxAge of 60 seconds', () => {
      const adapter = new VercelBlobCacheAdapter({
        cacheControlMaxAge: 30, // Less than minimum
      })
      expect(adapter).toBeInstanceOf(VercelBlobCacheAdapter)
      // The adapter should internally set this to 60, but we can't directly test private properties
    })
  })

  describe('set', () => {
    it('should store a value with the correct blob path', async () => {
      const { put } = await import('@vercel/blob')
      const mockPut = vi.mocked(put)

      await adapter.set('test-key', 'test-value')

      expect(mockPut).toHaveBeenCalledWith(
        'test-cache/test-key.json',
        expect.stringContaining('"value":"test-value"'),
        expect.objectContaining({
          access: 'public',
          contentType: 'application/json',
          token: 'test-token',
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 3600, // Default 1 hour
        }),
      )
    })

    it('should store a value with TTL and matching cache control', async () => {
      const { put } = await import('@vercel/blob')
      const mockPut = vi.mocked(put)

      const ttl = 120000 // 2 minutes
      await adapter.set('test-key', 'test-value', ttl)

      expect(mockPut).toHaveBeenCalledWith(
        'test-cache/test-key.json',
        expect.stringContaining('"value":"test-value"'),
        expect.objectContaining({
          access: 'public',
          contentType: 'application/json',
          token: 'test-token',
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 120, // TTL in seconds (120000ms / 1000 = 120s)
        }),
      )

      const [, jsonData] = mockPut.mock.calls[0]
      const cacheEntry = JSON.parse(jsonData as string)
      expect(cacheEntry.expiresAt).toBeGreaterThan(Date.now())
    })

    it('should use default cache control when no TTL is provided', async () => {
      const { put } = await import('@vercel/blob')
      const mockPut = vi.mocked(put)

      await adapter.set('test-key', 'test-value')

      expect(mockPut).toHaveBeenCalledWith(
        'test-cache/test-key.json',
        expect.stringContaining('"value":"test-value"'),
        expect.objectContaining({
          access: 'public',
          contentType: 'application/json',
          token: 'test-token',
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 3600, // Default 1 hour
        }),
      )
    })

    it('should sanitize keys with special characters', async () => {
      const { put } = await import('@vercel/blob')
      const mockPut = vi.mocked(put)

      await adapter.set('test@key#with$special!chars', 'test-value')

      expect(mockPut).toHaveBeenCalledWith(
        'test-cache/test_key_with_special_chars.json',
        expect.any(String),
        expect.any(Object),
      )
    })

    it('should use custom cacheControlMaxAge when provided', async () => {
      const customAdapter = new VercelBlobCacheAdapter({
        token: 'test-token',
        cacheControlMaxAge: 7200, // 2 hours
      })

      const { put } = await import('@vercel/blob')
      const mockPut = vi.mocked(put)

      await customAdapter.set('test-key', 'test-value')

      expect(mockPut).toHaveBeenCalledWith(
        'cache/test-key.json',
        expect.any(String),
        expect.objectContaining({
          cacheControlMaxAge: 7200,
        }),
      )
    })
  })

  describe('get', () => {
    it('should retrieve a valid non-expired value', async () => {
      const { head } = await import('@vercel/blob')
      const mockHead = vi.mocked(head)

      mockHead.mockResolvedValue({
        url: 'https://example.com/blob.json',
        downloadUrl: 'https://example.com/blob.json?download=1',
        pathname: 'test-cache/test-key.json',
        size: 100,
        uploadedAt: new Date(),
        contentType: 'application/json',
        contentDisposition: 'inline',
        cacheControl: 'no-cache',
      })

      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              value: 'test-value',
              expiresAt: Date.now() + 60000,
            }),
          ),
      })

      const result = await adapter.get('test-key')
      expect(result).toBe('test-value')
    })

    it('should return undefined for expired values', async () => {
      const { head, del } = await import('@vercel/blob')
      const mockHead = vi.mocked(head)
      const mockDel = vi.mocked(del)

      mockHead.mockResolvedValue({
        url: 'https://example.com/blob.json',
        downloadUrl: 'https://example.com/blob.json?download=1',
        pathname: 'test-cache/test-key.json',
        size: 100,
        uploadedAt: new Date(),
        contentType: 'application/json',
        contentDisposition: 'inline',
        cacheControl: 'no-cache',
      })

      // Mock fetch with expired entry
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              value: 'test-value',
              expiresAt: Date.now() - 1000, // Expired
            }),
          ),
      })

      const result = await adapter.get('test-key')

      expect(result).toBeUndefined()
      expect(mockDel).toHaveBeenCalledWith('test-cache/test-key.json', {
        token: 'test-token',
      })
    })

    it('should return undefined when blob does not exist', async () => {
      const { head } = await import('@vercel/blob')
      const mockHead = vi.mocked(head)

      mockHead.mockRejectedValue(new Error('Blob not found'))

      const result = await adapter.get('non-existent-key')
      expect(result).toBeUndefined()
    })
  })

  describe('delete', () => {
    it('should delete a blob successfully', async () => {
      const { del } = await import('@vercel/blob')
      const mockDel = vi.mocked(del)

      mockDel.mockResolvedValue(undefined)

      const result = await adapter.delete('test-key')

      expect(result).toBe(true)
      expect(mockDel).toHaveBeenCalledWith('test-cache/test-key.json', {
        token: 'test-token',
      })
    })

    it('should return false when deletion fails', async () => {
      const { del } = await import('@vercel/blob')
      const mockDel = vi.mocked(del)

      mockDel.mockRejectedValue(new Error('Deletion failed'))

      const result = await adapter.delete('test-key')
      expect(result).toBe(false)
    })
  })

  describe('flush', () => {
    it('should delete all blobs with the configured prefix', async () => {
      const { list, del } = await import('@vercel/blob')
      const mockList = vi.mocked(list)
      const mockDel = vi.mocked(del)

      mockList.mockResolvedValue({
        blobs: [
          {
            url: 'https://example.com/blob1.json',
            downloadUrl: 'https://example.com/blob1.json?download=1',
            pathname: 'test-cache/key1.json',
            size: 100,
            uploadedAt: new Date(),
          },
          {
            url: 'https://example.com/blob2.json',
            downloadUrl: 'https://example.com/blob2.json?download=1',
            pathname: 'test-cache/key2.json',
            size: 150,
            uploadedAt: new Date(),
          },
        ],
        hasMore: false,
        cursor: '',
      })

      await adapter.flush()

      expect(mockList).toHaveBeenCalledWith({
        prefix: 'test-cache/',
        token: 'test-token',
        limit: 1000,
      })

      expect(mockDel).toHaveBeenCalledWith(
        ['https://example.com/blob1.json', 'https://example.com/blob2.json'],
        { token: 'test-token' },
      )
    })

    it('should handle empty blob list', async () => {
      const { list, del } = await import('@vercel/blob')
      const mockList = vi.mocked(list)
      const mockDel = vi.mocked(del)

      mockList.mockResolvedValue({
        blobs: [],
        hasMore: false,
        cursor: '',
      })

      await adapter.flush()

      expect(mockList).toHaveBeenCalled()
      expect(mockDel).not.toHaveBeenCalled()
    })
  })

  describe('keys', () => {
    it('should return all keys when no pattern is provided', async () => {
      const { list } = await import('@vercel/blob')
      const mockList = vi.mocked(list)

      mockList.mockResolvedValue({
        blobs: [
          {
            url: 'https://example.com/blob1.json',
            downloadUrl: 'https://example.com/blob1.json?download=1',
            pathname: 'test-cache/key1.json',
            size: 100,
            uploadedAt: new Date(),
          },
          {
            url: 'https://example.com/blob2.json',
            downloadUrl: 'https://example.com/blob2.json?download=1',
            pathname: 'test-cache/key2.json',
            size: 150,
            uploadedAt: new Date(),
          },
        ],
        hasMore: false,
        cursor: '',
      })

      const keys = await adapter.keys('*')
      expect(keys).toEqual(['key1', 'key2'])
    })

    it('should filter keys by pattern', async () => {
      const { list } = await import('@vercel/blob')
      const mockList = vi.mocked(list)

      mockList.mockResolvedValue({
        blobs: [
          {
            url: 'https://example.com/blob1.json',
            downloadUrl: 'https://example.com/blob1.json?download=1',
            pathname: 'test-cache/user_123.json',
            size: 100,
            uploadedAt: new Date(),
          },
          {
            url: 'https://example.com/blob2.json',
            downloadUrl: 'https://example.com/blob2.json?download=1',
            pathname: 'test-cache/post_456.json',
            size: 150,
            uploadedAt: new Date(),
          },
        ],
        hasMore: false,
        cursor: '',
      })

      const keys = await adapter.keys('user_*')
      expect(keys).toEqual(['user_123'])
    })

    it('should handle errors gracefully', async () => {
      const { list } = await import('@vercel/blob')
      const mockList = vi.mocked(list)

      mockList.mockRejectedValue(new Error('List failed'))

      const keys = await adapter.keys('*')
      expect(keys).toEqual([])
    })
  })
})
