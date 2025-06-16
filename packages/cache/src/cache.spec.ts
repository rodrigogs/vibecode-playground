import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Cache } from './cache.js'
import type { CacheAdapter } from './cache-adapter.js'

describe('Cache', () => {
  // Create mock adapter for testing
  let mockAdapter: CacheAdapter

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks()

    // Create fresh mock adapter for each test
    mockAdapter = {
      set: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue('test-value'),
      delete: vi.fn().mockResolvedValue(true),
      flush: vi.fn().mockResolvedValue(undefined),
      keys: vi.fn().mockImplementation((pattern: string) => {
        if (pattern === 'exists') {
          return Promise.resolve(['exists'])
        }
        return Promise.resolve([])
      }),
    }
  })

  it('should create an instance with the provided adapter', () => {
    const cache = new Cache(mockAdapter)
    expect(cache).toBeInstanceOf(Cache)
  })

  it.each([
    [
      'set',
      async (cache: Cache) => await cache.set('test-key', 'test-value', 1000),
      'set',
      ['test-key', 'test-value', 1000],
    ],
    [
      'get',
      async (cache: Cache) => await cache.get('test-key'),
      'get',
      ['test-key'],
    ],
    [
      'delete',
      async (cache: Cache) => await cache.delete('test-key'),
      'delete',
      ['test-key'],
    ],
    ['flush', async (cache: Cache) => await cache.flush(), 'flush', []],
    [
      'keys',
      async (cache: Cache) => await cache.keys('test-pattern'),
      'keys',
      ['test-pattern'],
    ],
  ])(
    'should call adapter.%s when %s is called',
    async (methodName, cacheOperation, adapterMethod, expectedArgs) => {
      const cache = new Cache(mockAdapter)
      await cacheOperation(cache)

      expect(
        mockAdapter[adapterMethod as keyof typeof mockAdapter],
      ).toHaveBeenCalledTimes(1)
      if (expectedArgs.length > 0) {
        expect(
          mockAdapter[adapterMethod as keyof typeof mockAdapter],
        ).toHaveBeenCalledWith(...expectedArgs)
      }
    },
  )

  it.each([
    ['key exists', 'exists', true],
    ['key does not exist', 'non-existent', false],
  ])('should return %s result from has when %s', async (_, key, expected) => {
    const cache = new Cache(mockAdapter)
    const result = await cache.has(key)

    expect(mockAdapter.keys).toHaveBeenCalledTimes(1)
    expect(mockAdapter.keys).toHaveBeenCalledWith(key)
    expect(result).toBe(expected)
  })
})
