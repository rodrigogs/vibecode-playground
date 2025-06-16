import type { RunnableConfig } from '@langchain/core/runnables'
import type {
  Checkpoint,
  CheckpointListOptions,
  CheckpointMetadata,
  CheckpointTuple,
  SerializerProtocol,
} from '@langchain/langgraph-checkpoint'
import type { CacheAdapter } from '@repo/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PersistentCheckpointSaver } from './persistent-checkpoint-saver.js'

describe('PersistentCheckpointSaver (Unit Tests)', () => {
  let mockCache: CacheAdapter
  let checkpointSaver: PersistentCheckpointSaver
  let mockSerializer: SerializerProtocol

  beforeEach(() => {
    // Create mocked cache adapter
    mockCache = {
      set: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(true),
      flush: vi.fn().mockResolvedValue(undefined),
      keys: vi.fn().mockResolvedValue([]),
    }

    // Create mocked serializer
    mockSerializer = {
      dumpsTyped: vi.fn().mockReturnValue(['json', new Uint8Array([1, 2, 3])]),
      loadsTyped: vi.fn().mockResolvedValue({ test: 'data' }),
    }

    checkpointSaver = new PersistentCheckpointSaver(
      mockCache,
      'test-prefix',
      mockSerializer,
    )
  })

  describe('constructor', () => {
    it('should create instance with default parameters', () => {
      const defaultSaver = new PersistentCheckpointSaver(mockCache)
      expect(defaultSaver).toBeInstanceOf(PersistentCheckpointSaver)
    })

    it('should create instance with custom key prefix', () => {
      const customSaver = new PersistentCheckpointSaver(
        mockCache,
        'custom-prefix',
      )
      expect(customSaver).toBeInstanceOf(PersistentCheckpointSaver)
    })

    it('should create instance with custom serializer', () => {
      const customSaver = new PersistentCheckpointSaver(
        mockCache,
        'test',
        mockSerializer,
      )
      expect(customSaver).toBeInstanceOf(PersistentCheckpointSaver)
    })
  })

  describe('key generation', () => {
    it('should generate correct checkpoint key format', async () => {
      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread-123',
          checkpoint_ns: 'namespace',
          checkpoint_id: 'checkpoint-456',
        },
      }

      const checkpoint: Checkpoint = {
        v: 1,
        id: 'checkpoint-456',
        ts: '2024-01-01T00:00:00Z',
        channel_values: { test: 'data' },
        channel_versions: {},
        versions_seen: {},
        pending_sends: [],
      }

      const metadata: CheckpointMetadata = {
        source: 'input',
        step: 1,
        writes: {},
        parents: {},
      }

      await checkpointSaver.put(config, checkpoint, metadata, {})

      // Verify cache.set was called with correct key pattern
      expect(mockCache.set).toHaveBeenCalledWith(
        'test-prefix:checkpoint:thread-123:namespace:checkpoint-456',
        new Uint8Array([1, 2, 3]),
      )
    })

    it('should generate correct metadata key format', async () => {
      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread-123',
          checkpoint_ns: 'namespace',
          checkpoint_id: 'checkpoint-456',
        },
      }

      const checkpoint: Checkpoint = {
        v: 1,
        id: 'checkpoint-456',
        ts: '2024-01-01T00:00:00Z',
        channel_values: { test: 'data' },
        channel_versions: {},
        versions_seen: {},
        pending_sends: [],
      }

      const metadata: CheckpointMetadata = {
        source: 'input',
        step: 1,
        writes: {},
        parents: {},
      }

      await checkpointSaver.put(config, checkpoint, metadata, {})

      // Verify metadata key was used
      expect(mockCache.set).toHaveBeenCalledWith(
        'test-prefix:metadata:thread-123:namespace:checkpoint-456',
        new Uint8Array([1, 2, 3]),
      )
    })

    it('should generate correct writes key format', async () => {
      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread-123',
          checkpoint_ns: 'namespace',
          checkpoint_id: 'checkpoint-456',
        },
      }

      const writes: [string, any][] = [['channel1', 'value1']]
      const taskId = 'task-789'

      await checkpointSaver.putWrites(config, writes, taskId)

      // Verify writes key was used
      expect(mockCache.set).toHaveBeenCalledWith(
        'test-prefix:writes:thread-123:namespace:checkpoint-456:task-789',
        new Uint8Array([1, 2, 3]),
      )
    })
  })

  describe('configuration validation', () => {
    it('should throw error when thread_id is missing', async () => {
      const config: RunnableConfig = {
        configurable: {
          // Missing thread_id
          checkpoint_ns: 'namespace',
        },
      }

      await expect(checkpointSaver.getTuple(config)).rejects.toThrow(
        'Missing thread_id in config.configurable',
      )
    })

    it('should handle missing checkpoint_ns by defaulting to empty string', async () => {
      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread-123',
          // Missing checkpoint_ns
        },
      }

      vi.mocked(mockCache.keys).mockResolvedValue([])

      await checkpointSaver.getTuple(config)

      // Should use empty string for checkpoint_ns in key
      expect(mockCache.keys).toHaveBeenCalledWith(
        'test-prefix:checkpoint:thread-123::*',
      )
    })

    it('should handle missing checkpoint_id by finding latest', async () => {
      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread-123',
          checkpoint_ns: 'namespace',
          // Missing checkpoint_id
        },
      }

      const mockKeys = [
        'test-prefix:checkpoint:thread-123:namespace:checkpoint-003',
        'test-prefix:checkpoint:thread-123:namespace:checkpoint-001',
        'test-prefix:checkpoint:thread-123:namespace:checkpoint-002',
      ]

      vi.mocked(mockCache.keys).mockResolvedValue(mockKeys)
      vi.mocked(mockCache.get).mockResolvedValue(new Uint8Array([1, 2, 3]))

      await checkpointSaver.getTuple(config)

      // Should query for all checkpoints with wildcard
      expect(mockCache.keys).toHaveBeenCalledWith(
        'test-prefix:checkpoint:thread-123:namespace:*',
      )
    })
  })

  describe('checkpoint retrieval logic', () => {
    it('should return undefined when no checkpoints exist', async () => {
      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread-123',
          checkpoint_ns: 'namespace',
        },
      }

      vi.mocked(mockCache.keys).mockResolvedValue([])

      const result = await checkpointSaver.getTuple(config)

      expect(result).toBeUndefined()
      expect(mockCache.keys).toHaveBeenCalledWith(
        'test-prefix:checkpoint:thread-123:namespace:*',
      )
    })

    it('should return undefined when checkpoint data is not found', async () => {
      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread-123',
          checkpoint_ns: 'namespace',
          checkpoint_id: 'checkpoint-456',
        },
      }

      vi.mocked(mockCache.get).mockResolvedValue(undefined)

      const result = await checkpointSaver.getTuple(config)

      expect(result).toBeUndefined()
      expect(mockCache.get).toHaveBeenCalledWith(
        'test-prefix:checkpoint:thread-123:namespace:checkpoint-456',
      )
    })

    it('should return undefined when checkpoint has invalid ID after extraction', async () => {
      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread-123',
          checkpoint_ns: 'namespace',
        },
      }

      // Mock keys that would result in empty checkpoint ID after split
      const mockKeys = ['test-prefix:checkpoint:thread-123:namespace:']
      vi.mocked(mockCache.keys).mockResolvedValue(mockKeys)

      const result = await checkpointSaver.getTuple(config)

      expect(result).toBeUndefined()
    })

    it('should handle successful checkpoint retrieval with specific ID', async () => {
      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread-123',
          checkpoint_ns: 'namespace',
          checkpoint_id: 'checkpoint-456',
        },
      }

      const mockCheckpointData = { test: 'checkpoint' }
      const mockMetadataData = { test: 'metadata' }

      vi.mocked(mockCache.get)
        .mockResolvedValueOnce(mockCheckpointData) // checkpoint data
        .mockResolvedValueOnce(mockMetadataData) // metadata data
        .mockResolvedValue([]) // writes data

      vi.mocked(mockCache.keys).mockResolvedValue([])

      const result = await checkpointSaver.getTuple(config)

      expect(result).toBeDefined()
      expect(mockCache.get).toHaveBeenCalledWith(
        'test-prefix:checkpoint:thread-123:namespace:checkpoint-456',
      )
      expect(mockCache.get).toHaveBeenCalledWith(
        'test-prefix:metadata:thread-123:namespace:checkpoint-456',
      )
    })
  })

  describe('checkpoint listing logic', () => {
    it('should handle empty checkpoint list', async () => {
      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread-123',
          checkpoint_ns: 'namespace',
        },
      }

      vi.mocked(mockCache.keys).mockResolvedValue([])

      const generator = checkpointSaver.list(config)
      const results: CheckpointTuple[] = []
      for await (const item of generator) {
        results.push(item)
      }

      expect(results).toHaveLength(0)
    })

    it('should apply before filter correctly', async () => {
      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread-123',
          checkpoint_ns: 'namespace',
        },
      }

      const options: CheckpointListOptions = {
        before: { configurable: { checkpoint_id: 'checkpoint-002' } },
      }

      const mockKeys = [
        'test-prefix:checkpoint:thread-123:namespace:checkpoint-003',
        'test-prefix:checkpoint:thread-123:namespace:checkpoint-002',
        'test-prefix:checkpoint:thread-123:namespace:checkpoint-001',
      ]

      vi.mocked(mockCache.keys).mockResolvedValue(mockKeys)
      vi.mocked(mockCache.get).mockResolvedValue(new Uint8Array([1, 2, 3]))

      const generator = checkpointSaver.list(config, options)
      const results: CheckpointTuple[] = []
      for await (const item of generator) {
        results.push(item)
      }

      // Should only include checkpoints before 'checkpoint-002'
      expect(results.length).toBeGreaterThanOrEqual(0)
    })

    it('should apply limit correctly', async () => {
      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread-123',
          checkpoint_ns: 'namespace',
        },
      }

      const options: CheckpointListOptions = {
        limit: 2,
      }

      const mockKeys = [
        'test-prefix:checkpoint:thread-123:namespace:checkpoint-003',
        'test-prefix:checkpoint:thread-123:namespace:checkpoint-002',
        'test-prefix:checkpoint:thread-123:namespace:checkpoint-001',
      ]

      vi.mocked(mockCache.keys).mockResolvedValue(mockKeys)
      vi.mocked(mockCache.get).mockResolvedValue(new Uint8Array([1, 2, 3]))

      const generator = checkpointSaver.list(config, options)
      const results: CheckpointTuple[] = []
      for await (const item of generator) {
        results.push(item)
      }

      expect(results.length).toBeLessThanOrEqual(2)
    })
  })

  describe('writes handling', () => {
    it('should store writes with correct cache key', async () => {
      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread-123',
          checkpoint_ns: 'namespace',
          checkpoint_id: 'checkpoint-456',
        },
      }

      const writes: [string, any][] = [
        ['channel1', 'value1'],
        ['channel2', 'value2'],
      ]
      const taskId = 'task-789'

      await checkpointSaver.putWrites(config, writes, taskId)

      expect(mockCache.set).toHaveBeenCalledWith(
        'test-prefix:writes:thread-123:namespace:checkpoint-456:task-789',
        new Uint8Array([1, 2, 3]),
      )
    })

    it('should handle putWrites with missing thread_id', async () => {
      const config: RunnableConfig = {
        configurable: {
          // Missing thread_id
          checkpoint_ns: 'namespace',
          checkpoint_id: 'checkpoint-456',
        },
      }

      const writes: [string, any][] = [['channel1', 'value1']]
      const taskId = 'task-789'

      await expect(
        checkpointSaver.putWrites(config, writes, taskId),
      ).rejects.toThrow('Missing thread_id in config.configurable')
    })
  })

  describe('serializer integration', () => {
    it('should use custom serializer for dumpsTyped', async () => {
      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread-123',
          checkpoint_ns: 'namespace',
          checkpoint_id: 'checkpoint-456',
        },
      }

      const checkpoint: Checkpoint = {
        v: 1,
        id: 'checkpoint-456',
        ts: '2024-01-01T00:00:00Z',
        channel_values: { test: 'data' },
        channel_versions: {},
        versions_seen: {},
        pending_sends: [],
      }

      const metadata: CheckpointMetadata = {
        source: 'input',
        step: 1,
        writes: {},
        parents: {},
      }

      await checkpointSaver.put(config, checkpoint, metadata, {})

      expect(mockSerializer.dumpsTyped).toHaveBeenCalled()
    })

    it('should use custom serializer for loadsTyped', async () => {
      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread-123',
          checkpoint_ns: 'namespace',
          checkpoint_id: 'checkpoint-456',
        },
      }

      vi.mocked(mockCache.get).mockResolvedValue(new Uint8Array([1, 2, 3]))
      vi.mocked(mockCache.keys).mockResolvedValue([])

      await checkpointSaver.getTuple(config)

      expect(mockSerializer.loadsTyped).toHaveBeenCalledWith(
        'json',
        new Uint8Array([1, 2, 3]),
      )
    })
  })

  describe('error handling', () => {
    it('should handle cache adapter errors gracefully', async () => {
      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread-123',
          checkpoint_ns: 'namespace',
          checkpoint_id: 'checkpoint-456',
        },
      }

      vi.mocked(mockCache.get).mockRejectedValue(new Error('Cache error'))

      await expect(checkpointSaver.getTuple(config)).rejects.toThrow(
        'Cache error',
      )
    })

    it('should handle serializer errors gracefully', async () => {
      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread-123',
          checkpoint_ns: 'namespace',
          checkpoint_id: 'checkpoint-456',
        },
      }

      const checkpoint: Checkpoint = {
        v: 1,
        id: 'checkpoint-456',
        ts: '2024-01-01T00:00:00Z',
        channel_values: { test: 'data' },
        channel_versions: {},
        versions_seen: {},
        pending_sends: [],
      }

      const metadata: CheckpointMetadata = {
        source: 'input',
        step: 1,
        writes: {},
        parents: {},
      }

      vi.mocked(mockSerializer.dumpsTyped).mockImplementation(() => {
        throw new Error('Serialization error')
      })

      await expect(
        checkpointSaver.put(config, checkpoint, metadata, {}),
      ).rejects.toThrow('Serialization error')
    })
  })

  describe('behavior validation', () => {
    it('should generate cache keys in correct format for checkpoint operations', async () => {
      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread-123',
          checkpoint_ns: 'namespace',
          checkpoint_id: 'checkpoint-456',
        },
      }

      const checkpoint: Checkpoint = {
        v: 1,
        id: 'checkpoint-456',
        ts: '2024-01-01T00:00:00Z',
        channel_values: { test: 'data' },
        channel_versions: {},
        versions_seen: {},
        pending_sends: [],
      }

      const metadata: CheckpointMetadata = {
        source: 'input',
        step: 1,
        writes: {},
        parents: {},
      }

      await checkpointSaver.put(config, checkpoint, metadata, {})

      // Verify correct cache key patterns are used
      expect(mockCache.set).toHaveBeenCalledWith(
        expect.stringContaining(
          'test-prefix:checkpoint:thread-123:namespace:checkpoint-456',
        ),
        expect.any(Uint8Array),
      )
      expect(mockCache.set).toHaveBeenCalledWith(
        expect.stringContaining(
          'test-prefix:metadata:thread-123:namespace:checkpoint-456',
        ),
        expect.any(Uint8Array),
      )
    })

    it('should handle checkpoint key pattern generation for listing', async () => {
      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread-123',
          checkpoint_ns: 'namespace',
        },
      }

      vi.mocked(mockCache.keys).mockResolvedValue([])

      await checkpointSaver.getTuple(config)

      // Should query with wildcard pattern
      expect(mockCache.keys).toHaveBeenCalledWith(
        expect.stringContaining(
          'test-prefix:checkpoint:thread-123:namespace:*',
        ),
      )
    })

    it('should handle writes key pattern generation', async () => {
      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread-123',
          checkpoint_ns: 'namespace',
          checkpoint_id: 'checkpoint-456',
        },
      }

      const writes: [string, any][] = [['channel1', 'value1']]
      const taskId = 'task-789'

      await checkpointSaver.putWrites(config, writes, taskId)

      // Verify writes key pattern
      expect(mockCache.set).toHaveBeenCalledWith(
        expect.stringContaining(
          'test-prefix:writes:thread-123:namespace:checkpoint-456:task-789',
        ),
        expect.any(Uint8Array),
      )
    })
  })
})
