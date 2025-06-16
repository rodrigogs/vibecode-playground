import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MemoryCacheAdapter } from './memory-cache-adapter.js'

describe('MemoryCacheAdapter', () => {
  let adapter: MemoryCacheAdapter

  beforeEach(() => {
    adapter = new MemoryCacheAdapter()
  })

  describe('set', () => {
    it('should store a value without expiration when no ttl is provided', async () => {
      await adapter.set('key', 'value')

      // Using private property for testing implementation details
      const store = (adapter as any).store
      expect(store.has('key')).toBe(true)
      expect(store.get('key')).toEqual({
        value: 'value',
        expiresAt: undefined,
      })
    })

    it('should store a value with expiration when ttl is provided', async () => {
      const now = Date.now()
      const realDateNow = Date.now
      Date.now = vi.fn(() => now)

      const ttl = 1000 // 1 second
      await adapter.set('key', 'value', ttl)

      // Using private property for testing implementation details
      const store = (adapter as any).store
      expect(store.get('key')).toEqual({
        value: 'value',
        expiresAt: now + ttl,
      })

      // Restore Date.now
      Date.now = realDateNow
    })
  })

  describe('get', () => {
    it('should return undefined for non-existent key', async () => {
      const result = await adapter.get('nonexistent')
      expect(result).toBeUndefined()
    })

    it('should return the stored value for a valid key', async () => {
      await adapter.set('key', 'value')
      const result = await adapter.get('key')
      expect(result).toBe('value')
    })

    it('should delete and return undefined for an expired key', async () => {
      const now = Date.now()
      const realDateNow = Date.now

      // First set the value (using the real Date.now)
      await adapter.set('key', 'value', 100) // 100ms TTL

      // Mock Date.now to a future time past expiration
      Date.now = vi.fn(() => now + 200) // 200ms later

      const result = await adapter.get('key')

      // Verify the key was deleted and undefined returned
      expect(result).toBeUndefined()

      const store = (adapter as any).store
      expect(store.has('key')).toBe(false)

      // Restore Date.now
      Date.now = realDateNow
    })
  })

  describe('delete', () => {
    it('should return false when deleting a non-existent key', async () => {
      const result = await adapter.delete('nonexistent')
      expect(result).toBe(false)
    })

    it('should delete a key and return true', async () => {
      await adapter.set('key', 'value')
      const result = await adapter.delete('key')
      expect(result).toBe(true)
      expect(await adapter.get('key')).toBeUndefined()
    })
  })

  describe('flush', () => {
    it('should clear all values', async () => {
      await adapter.set('key1', 'value1')
      await adapter.set('key2', 'value2')

      await adapter.flush()

      expect(await adapter.get('key1')).toBeUndefined()
      expect(await adapter.get('key2')).toBeUndefined()

      const store = (adapter as any).store
      expect(store.size).toBe(0)
    })
  })

  describe('keys', () => {
    beforeEach(async () => {
      // Setup some test data
      await adapter.set('test1', 'value1')
      await adapter.set('test2', 'value2')
      await adapter.set('other', 'value3')
    })

    it('should return all keys when no pattern is provided', async () => {
      const keys = await adapter.keys('')
      expect(keys).toHaveLength(3)
      expect(keys).toContain('test1')
      expect(keys).toContain('test2')
      expect(keys).toContain('other')
    })

    it('should return all keys when pattern is *', async () => {
      const keys = await adapter.keys('*')
      expect(keys).toHaveLength(3)
    })

    it('should filter keys according to the pattern', async () => {
      const keys = await adapter.keys('test*')
      expect(keys).toHaveLength(2)
      expect(keys).toContain('test1')
      expect(keys).toContain('test2')
      expect(keys).not.toContain('other')
    })
  })
})
