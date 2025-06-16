/**
 * Main entrypoint for the library. Re-export the essentials.
 */
export { FsCacheAdapter } from './adapters/fs-cache-adapter.js'
export { MemoryCacheAdapter } from './adapters/memory-cache-adapter.js'
export { Cache } from './cache.js'
export type { CacheAdapter } from './cache-adapter.js'
