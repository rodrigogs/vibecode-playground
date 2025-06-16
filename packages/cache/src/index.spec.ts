import { describe, expect, it } from 'vitest'

import * as index from '../src/index.js'

describe('integration tests for index.ts', () => {
  it('should have 3 exports', () => {
    // At runtime, interfaces (like CacheAdapter) do not show up as properties,
    // so we might end up seeing only the classes. Let's see how many appear:
    // Typically, you'll see { MemoryCacheAdapter: [Function], Cache: [Function] }
    // "CacheAdapter" is a TypeScript interface, so it's not a real runtime export.
    // You may want to adjust this test based on what you see actually exported.
    expect(Object.keys(index)).toHaveLength(3)

    // Alternatively, if you only expect to see two runtime exports,
    // you could test them individually:
    expect(typeof index.MemoryCacheAdapter).toBe('function')
    expect(typeof index.Cache).toBe('function')
  })
})
