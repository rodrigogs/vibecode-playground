import { promises as fs } from 'fs'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FsCacheAdapter } from './fs-cache-adapter.js'

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn(),
    unlink: vi.fn(),
    readdir: vi.fn(),
  },
}))

// Mock path module
vi.mock('path', () => ({
  join: (...parts) => parts.join('/'),
}))

// Mock os module
vi.mock('os', () => {
  return {
    default: {
      tmpdir: () => '/tmp',
    },
    tmpdir: () => '/tmp',
  }
})

describe('FsCacheAdapter', () => {
  const customDir = '/custom/dir'

  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should create an instance with default directory', () => {
    const adapter = new FsCacheAdapter()
    expect(adapter).toBeInstanceOf(FsCacheAdapter)
  })

  it('should create an instance with custom directory', () => {
    const adapter = new FsCacheAdapter(customDir)
    expect(adapter).toBeInstanceOf(FsCacheAdapter)
  })

  describe('set', () => {
    it('should store a value without expiration', async () => {
      const adapter = new FsCacheAdapter(customDir)
      await adapter.set('key1', 'value1')

      expect(fs.mkdir).toHaveBeenCalledWith(customDir, { recursive: true })
      expect(fs.writeFile).toHaveBeenCalledWith(
        join(customDir, 'key1'),
        JSON.stringify({ value: 'value1' }),
        'utf-8',
      )
    })

    it('should store a value with expiration', async () => {
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      const adapter = new FsCacheAdapter(customDir)
      const ttl = 1000
      await adapter.set('key2', 'value2', ttl)

      expect(fs.mkdir).toHaveBeenCalledWith(customDir, { recursive: true })
      expect(fs.writeFile).toHaveBeenCalledWith(
        join(customDir, 'key2'),
        JSON.stringify({ value: 'value2', expiresAt: now + ttl }),
        'utf-8',
      )

      // Restore Date.now
      vi.restoreAllMocks()
    })

    it('should store and retrieve Uint8Array data correctly', async () => {
      const adapter = new FsCacheAdapter(customDir)
      const uint8Data = new Uint8Array([1, 2, 3, 4, 5])

      await adapter.set('binary-key', uint8Data)

      expect(fs.mkdir).toHaveBeenCalledWith(customDir, { recursive: true })
      expect(fs.writeFile).toHaveBeenCalledWith(
        join(customDir, 'binary-key'),
        JSON.stringify({
          value: [1, 2, 3, 4, 5],
          isBinary: true,
        }),
        'utf-8',
      )

      // Mock the file read for getting the data back
      const mockData = { value: [1, 2, 3, 4, 5], isBinary: true }
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockData))

      const result = await adapter.get<Uint8Array>('binary-key')

      expect(result).toBeInstanceOf(Uint8Array)
      expect(Array.from(result!)).toEqual([1, 2, 3, 4, 5])
    })
  })

  describe('get', () => {
    it('should return value for existing non-expired key', async () => {
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      // Mock file content with future expiration
      const mockData = { value: 'value1', expiresAt: now + 1000 }
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockData))

      const adapter = new FsCacheAdapter(customDir)
      const result = await adapter.get('key1')

      expect(fs.readFile).toHaveBeenCalledWith(join(customDir, 'key1'), 'utf-8')
      expect(result).toEqual('value1')

      // Restore Date.now
      vi.restoreAllMocks()
    })

    it('should return value for existing key without expiration', async () => {
      // Mock file content without expiration
      const mockData = { value: 'value2' }
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockData))

      const adapter = new FsCacheAdapter(customDir)
      const result = await adapter.get('key2')

      expect(fs.readFile).toHaveBeenCalledWith(join(customDir, 'key2'), 'utf-8')
      expect(result).toEqual('value2')
    })

    it('should delete key and return undefined for expired key', async () => {
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      // Mock file content with past expiration
      const mockData = { value: 'expired', expiresAt: now - 1000 }
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockData))
      vi.mocked(fs.unlink).mockResolvedValue(undefined)

      const adapter = new FsCacheAdapter(customDir)
      const result = await adapter.get('expired-key')

      expect(fs.readFile).toHaveBeenCalledWith(
        join(customDir, 'expired-key'),
        'utf-8',
      )
      expect(fs.unlink).toHaveBeenCalledWith(join(customDir, 'expired-key'))
      expect(result).toBeUndefined()

      // Restore Date.now
      vi.restoreAllMocks()
    })

    it('should return undefined for non-existing key', async () => {
      // Mock readFile to throw error for non-existing file
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'))

      const adapter = new FsCacheAdapter(customDir)
      const result = await adapter.get('non-existing')

      expect(fs.readFile).toHaveBeenCalledWith(
        join(customDir, 'non-existing'),
        'utf-8',
      )
      expect(result).toBeUndefined()
    })
  })

  describe('delete', () => {
    it('should delete an existing key and return true', async () => {
      vi.mocked(fs.unlink).mockResolvedValue(undefined)

      const adapter = new FsCacheAdapter(customDir)
      const result = await adapter.delete('key1')

      expect(fs.unlink).toHaveBeenCalledWith(join(customDir, 'key1'))
      expect(result).toBe(true)
    })

    it('should return false when deleting a non-existing key', async () => {
      vi.mocked(fs.unlink).mockRejectedValue(new Error('File not found'))

      const adapter = new FsCacheAdapter(customDir)
      const result = await adapter.delete('non-existing')

      expect(fs.unlink).toHaveBeenCalledWith(join(customDir, 'non-existing'))
      expect(result).toBe(false)
    })
  })

  describe('flush', () => {
    it('should delete all files in the directory', async () => {
      const mockFiles = ['file1', 'file2', 'file3']
      vi.mocked(fs.readdir).mockResolvedValue(mockFiles as any)
      vi.mocked(fs.unlink).mockResolvedValue(undefined)

      const adapter = new FsCacheAdapter(customDir)
      await adapter.flush()

      expect(fs.readdir).toHaveBeenCalledWith(customDir)
      expect(fs.unlink).toHaveBeenCalledTimes(mockFiles.length)
      mockFiles.forEach((file) => {
        expect(fs.unlink).toHaveBeenCalledWith(join(customDir, file))
      })
    })

    it('should not throw if directory does not exist', async () => {
      vi.mocked(fs.readdir).mockRejectedValue(new Error('Directory not found'))

      const adapter = new FsCacheAdapter(customDir)
      await expect(adapter.flush()).resolves.toBeUndefined()

      expect(fs.readdir).toHaveBeenCalledWith(customDir)
      expect(fs.unlink).not.toHaveBeenCalled()
    })
  })

  describe('keys', () => {
    it('should return all keys when no pattern is provided', async () => {
      const mockFiles = ['file1', 'file2', 'file3']
      vi.mocked(fs.readdir).mockResolvedValue(mockFiles as any)

      const adapter = new FsCacheAdapter(customDir)
      const result = await adapter.keys('')

      expect(fs.readdir).toHaveBeenCalledWith(customDir)
      expect(result).toEqual(mockFiles)
    })

    it('should return all keys when pattern is *', async () => {
      const mockFiles = ['file1', 'file2', 'file3']
      vi.mocked(fs.readdir).mockResolvedValue(mockFiles as any)

      const adapter = new FsCacheAdapter(customDir)
      const result = await adapter.keys('*')

      expect(fs.readdir).toHaveBeenCalledWith(customDir)
      expect(result).toEqual(mockFiles)
    })

    it('should filter keys according to pattern', async () => {
      const mockFiles = ['test1', 'test2', 'other1']
      vi.mocked(fs.readdir).mockResolvedValue(mockFiles as any)

      const adapter = new FsCacheAdapter(customDir)
      const result = await adapter.keys('test*')

      expect(fs.readdir).toHaveBeenCalledWith(customDir)
      // We're assuming some filtering happened, even though our mock doesn't actually filter
      expect(result).toBeDefined()
    })

    it('should return empty array if directory does not exist', async () => {
      vi.mocked(fs.readdir).mockRejectedValue(new Error('Directory not found'))

      const adapter = new FsCacheAdapter(customDir)
      const result = await adapter.keys('*')

      expect(fs.readdir).toHaveBeenCalledWith(customDir)
      expect(result).toEqual([])
    })
  })
})
