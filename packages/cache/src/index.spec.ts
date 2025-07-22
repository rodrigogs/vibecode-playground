import { describe, expect, it } from 'vitest'

import * as index from '../src/index.js'

describe('integration tests for index.ts', () => {
  it('should have 4 exports', () => {
    // At runtime, interfaces (like CacheAdapter) do not show up as properties,
    // so we might end up seeing only the classes. Let's see how many appear:
    // Typically, you'll see { MemoryCacheAdapter: [Function], FsCacheAdapter: [Function], VercelBlobCacheAdapter: [Function], Cache: [Function] }
    // "CacheAdapter" is a TypeScript interface, so it's not a real runtime export.
    // We now have 4 exports: FsCacheAdapter, MemoryCacheAdapter, VercelBlobCacheAdapter, and Cache
    expect(Object.keys(index)).toHaveLength(4)

    // Test each export individually:
    expect(typeof index.FsCacheAdapter).toBe('function')
    expect(typeof index.MemoryCacheAdapter).toBe('function')
    expect(typeof index.VercelBlobCacheAdapter).toBe('function')
    expect(typeof index.Cache).toBe('function')
  })
})
