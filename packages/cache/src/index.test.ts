import { describe, expect, it } from 'vitest'

import { Cache, MemoryCacheAdapter } from './index.js'

describe('Integration Test - Cache with MemoryCacheAdapter', () => {
  it.each([
    {
      name: 'set and get a value',
      setup: async (cache: Cache) => {
        await cache.set('foo', 'bar')
      },
      test: async (cache: Cache) => {
        expect(await cache.get('foo')).toBe('bar')
      },
    },
    {
      name: 'delete a value',
      setup: async (cache: Cache) => {
        await cache.set('foo', 'bar')
      },
      test: async (cache: Cache) => {
        expect(await cache.delete('foo')).toBe(true)
        expect(await cache.get('foo')).toBeUndefined()
      },
    },
    {
      name: 'flush all values',
      setup: async (cache: Cache) => {
        await cache.set('key1', 'val1')
        await cache.set('key2', 'val2')
      },
      test: async (cache: Cache) => {
        await cache.flush()
        expect(await cache.get('key1')).toBeUndefined()
        expect(await cache.get('key2')).toBeUndefined()
      },
    },
  ] as const)('should $name', async ({ setup, test }) => {
    const cache = new Cache(new MemoryCacheAdapter())
    await setup(cache)
    await test(cache)
  })
})
