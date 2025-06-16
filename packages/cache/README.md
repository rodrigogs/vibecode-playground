# @repo/cache

Flexible caching system with pluggable adapters. Supports memory and filesystem storage with TTL and pattern matching.

## API

### Cache Class

```typescript
import { Cache, MemoryCacheAdapter, FsCacheAdapter } from '@repo/cache'

// Memory cache
const memoryCache = new Cache(new MemoryCacheAdapter())

// Filesystem cache  
const fsCache = new Cache(new FsCacheAdapter({ cacheDir: './cache' }))

// Operations
await cache.set('key', 'value')
await cache.set('key', 'value', 5000) // TTL in milliseconds
const value = await cache.get<string>('key')
const exists = await cache.has('key')
const deleted = await cache.delete('key')
await cache.flush() // Clear all

// Pattern matching  
const keys = await cache.keys('user:*') // Glob patterns
```

### Adapters

#### MemoryCacheAdapter
In-memory storage with automatic TTL cleanup.

#### FsCacheAdapter
File system storage with configurable directory.

```typescript
const adapter = new FsCacheAdapter({ 
  cacheDir: './data/cache' // Default: './cache'
})
```

## Usage Examples

### Basic Operations

```typescript
const cache = new Cache(new MemoryCacheAdapter())

// Set with TTL
await cache.set('session:abc123', { userId: 456 }, 30 * 60 * 1000) // 30 minutes

// Get and check
const session = await cache.get<Session>('session:abc123')
if (await cache.has('session:abc123')) {
  await cache.delete('session:abc123')
}
```

### Pattern Matching

```typescript
await cache.set('user:123', { name: 'Alice' })
await cache.set('user:456', { name: 'Bob' })

// Get all user keys
const userKeys = await cache.keys('user:*')
// Returns: ['user:123', 'user:456']
```

### Custom Cache Wrapper

```typescript
class UserCache {
  constructor(private cache: Cache) {}

  async getUser(id: string): Promise<User | null> {
    return this.cache.get<User>(`user:${id}`)
  }

  async setUser(id: string, user: User, ttl = 3600000): Promise<void> {
    await this.cache.set(`user:${id}`, user, ttl)
  }

  async invalidateUser(id: string): Promise<boolean> {
    return this.cache.delete(`user:${id}`)
  }
}
```

## Custom Adapter Example

```typescript
import { CacheAdapter } from '@repo/cache'

class RedisCacheAdapter implements CacheAdapter {
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    // Redis implementation
  }

  async get<T>(key: string): Promise<T | undefined> {
    // Redis implementation  
  }

  async delete(key: string): Promise<boolean> {
    // Redis implementation
  }

  async flush(): Promise<void> {
    // Redis implementation
  }

  async keys(pattern: string): Promise<string[]> {
    // Redis implementation
  }
}
```
