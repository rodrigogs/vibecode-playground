import type { RunnableConfig } from '@langchain/core/runnables'
import {
  BaseCheckpointSaver,
  type ChannelVersions,
  type Checkpoint,
  type CheckpointListOptions,
  type CheckpointMetadata,
  type CheckpointPendingWrite,
  type CheckpointTuple,
  type PendingWrite,
  type SerializerProtocol,
} from '@langchain/langgraph-checkpoint'
import type { CacheAdapter } from '@repo/cache'

/**
 * Simple JSON serializer for checkpoint data
 * This implements the SerializerProtocol interface required by BaseCheckpointSaver
 */
class JsonSerializer implements SerializerProtocol {
  /**
   * Serialize data to JSON string and convert to Uint8Array
   */
  dumpsTyped(data: unknown): [string, Uint8Array] {
    const jsonString = JSON.stringify(data)
    const uint8Array = new TextEncoder().encode(jsonString)
    return ['json', uint8Array]
  }

  /**
   * Deserialize Uint8Array back to original data
   */
  async loadsTyped(type: string, data: Uint8Array): Promise<unknown> {
    if (type !== 'json') {
      throw new Error(`Unsupported serialization type: ${type}`)
    }
    const jsonString = new TextDecoder().decode(data)
    return JSON.parse(jsonString)
  }
}

/**
 * A persistent checkpoint saver that uses the @repo/cache package for storage.
 *
 * This implementation follows LangChain/LangGraph patterns and properly implements
 * the BaseCheckpointSaver interface with:
 * - Thread-based organization with thread_id and checkpoint_ns
 * - Proper checkpoint structure with id, ts, channel_values, etc.
 * - Full serialization support using JsonSerializer
 * - Complete compliance with BaseCheckpointSaver interface
 * - Support for pending writes and sends
 * - Proper metadata handling with parents tracking
 */
export class PersistentCheckpointSaver extends BaseCheckpointSaver {
  private cache: CacheAdapter
  private keyPrefix: string

  constructor(
    cache: CacheAdapter,
    keyPrefix = 'checkpoint',
    serde?: SerializerProtocol,
  ) {
    super(serde ?? new JsonSerializer())
    this.cache = cache
    this.keyPrefix = keyPrefix
  }

  /**
   * Generate cache key for a checkpoint
   * Format: {prefix}:checkpoint:{thread_id}:{checkpoint_ns}:{checkpoint_id}
   */
  private getCheckpointKey(
    threadId: string,
    checkpointNs: string,
    checkpointId: string,
  ): string {
    return `${this.keyPrefix}:checkpoint:${threadId}:${checkpointNs}:${checkpointId}`
  }

  /**
   * Generate cache key for checkpoint metadata
   * Format: {prefix}:metadata:{thread_id}:{checkpoint_ns}:{checkpoint_id}
   */
  private getMetadataKey(
    threadId: string,
    checkpointNs: string,
    checkpointId: string,
  ): string {
    return `${this.keyPrefix}:metadata:${threadId}:${checkpointNs}:${checkpointId}`
  }

  /**
   * Generate cache key for checkpoint writes
   * Format: {prefix}:writes:{thread_id}:{checkpoint_ns}:{checkpoint_id}:{task_id}
   */
  private getWritesKey(
    threadId: string,
    checkpointNs: string,
    checkpointId: string,
    taskId: string,
  ): string {
    return `${this.keyPrefix}:writes:${threadId}:${checkpointNs}:${checkpointId}:${taskId}`
  }

  /**
   * Generate pattern for listing checkpoints by thread
   * Format: {prefix}:checkpoint:{thread_id}:{checkpoint_ns}:*
   */
  private getCheckpointPattern(threadId: string, checkpointNs: string): string {
    return `${this.keyPrefix}:checkpoint:${threadId}:${checkpointNs}:*`
  }

  /**
   * Generate pattern for getting writes for a checkpoint
   * Format: {prefix}:writes:{thread_id}:{checkpoint_ns}:{checkpoint_id}:*
   */
  private getWritesPattern(
    threadId: string,
    checkpointNs: string,
    checkpointId: string,
  ): string {
    return `${this.keyPrefix}:writes:${threadId}:${checkpointNs}:${checkpointId}:*`
  }

  /**
   * Extract configurable values from RunnableConfig
   */
  private extractConfigurable(config: RunnableConfig) {
    const threadId = config.configurable?.thread_id
    const checkpointNs = config.configurable?.checkpoint_ns ?? ''
    const checkpointId = config.configurable?.checkpoint_id

    if (!threadId) {
      throw new Error('Missing thread_id in config.configurable')
    }

    return { threadId, checkpointNs, checkpointId }
  }

  /**
   * Extract checkpoint ID from a sorted key
   * This helper method extracts the checkpoint ID from a cache key and validates it
   */
  private extractCheckpointIdFromKey(key: string): string | undefined {
    const checkpointId = key.split(':').pop() || ''
    return checkpointId || undefined
  }

  /**
   * Find the latest checkpoint ID from cache keys
   * This method finds the latest checkpoint ID from the provided cache keys
   */
  private async findLatestCheckpointId(
    threadId: string,
    checkpointNs: string,
  ): Promise<string | undefined> {
    const pattern = this.getCheckpointPattern(threadId, checkpointNs)
    const keys = await this.cache.keys(pattern)

    if (keys.length === 0) {
      return undefined
    }

    // Sort by checkpoint_id (descending - newest first)
    const sortedKeys = keys.sort((a, b) => {
      const idA = a.split(':').pop() || ''
      const idB = b.split(':').pop() || ''
      return idB.localeCompare(idA)
    })

    // Extract checkpoint ID from the first (latest) key
    const latestKey = sortedKeys[0]!
    return this.extractCheckpointIdFromKey(latestKey)
  }

  /**
   * Get a checkpoint tuple from storage
   * This method retrieves a checkpoint tuple from the cache based on the provided config.
   * If the config contains a "checkpoint_id" key, the checkpoint with the matching
   * thread_id, checkpoint_ns, and checkpoint_id is retrieved.
   * Otherwise, the latest checkpoint for the given thread_id and checkpoint_ns is retrieved.
   */
  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    const { threadId, checkpointNs, checkpointId } =
      this.extractConfigurable(config)

    let targetCheckpointId: string | undefined = checkpointId

    // If no specific checkpoint_id provided, find the latest one
    if (!targetCheckpointId) {
      targetCheckpointId = await this.findLatestCheckpointId(
        threadId,
        checkpointNs,
      )

      if (!targetCheckpointId) {
        return undefined
      }
    }

    // Retrieve checkpoint and metadata
    const checkpointKey = this.getCheckpointKey(
      threadId,
      checkpointNs,
      targetCheckpointId,
    )
    const metadataKey = this.getMetadataKey(
      threadId,
      checkpointNs,
      targetCheckpointId,
    )

    const [serializedCheckpoint, serializedMetadata] = await Promise.all([
      this.cache.get<Uint8Array>(checkpointKey),
      this.cache.get<Uint8Array>(metadataKey),
    ])

    if (!serializedCheckpoint || !serializedMetadata) {
      return undefined
    }

    // Deserialize checkpoint and metadata
    const checkpoint = (await this.serde.loadsTyped(
      'json',
      serializedCheckpoint,
    )) as Checkpoint
    const metadata = (await this.serde.loadsTyped(
      'json',
      serializedMetadata,
    )) as CheckpointMetadata

    // Get pending writes for this checkpoint
    const writesPattern = this.getWritesPattern(
      threadId,
      checkpointNs,
      targetCheckpointId,
    )
    const writeKeys = await this.cache.keys(writesPattern)
    const pendingWrites: CheckpointPendingWrite[] = []

    for (const writeKey of writeKeys) {
      const serializedWrites = await this.cache.get<Uint8Array>(writeKey)
      if (serializedWrites) {
        const writes = (await this.serde.loadsTyped(
          'json',
          serializedWrites,
        )) as CheckpointPendingWrite[]

        // Ensure writes is an array before spreading
        if (Array.isArray(writes)) {
          pendingWrites.push(...writes)
        }
      }
    }

    // Build the final config
    const finalConfig: RunnableConfig = {
      configurable: {
        thread_id: threadId,
        checkpoint_ns: checkpointNs,
        checkpoint_id: targetCheckpointId,
      },
    }

    // Determine parent config if this checkpoint has a parent
    let parentConfig: RunnableConfig | undefined
    if (metadata.parents && Object.keys(metadata.parents).length > 0) {
      // Get the first parent (typically the default parent)
      const parentId = Object.values(metadata.parents)[0]
      if (parentId) {
        parentConfig = {
          configurable: {
            thread_id: threadId,
            checkpoint_ns: checkpointNs,
            checkpoint_id: parentId,
          },
        }
      }
    }

    return {
      config: finalConfig,
      checkpoint,
      metadata,
      parentConfig,
      pendingWrites: pendingWrites.length > 0 ? pendingWrites : undefined,
    }
  }

  /**
   * List checkpoints from storage
   * This method retrieves a list of checkpoint tuples from the cache based on the
   * provided config. The checkpoints are ordered by checkpoint ID in descending order (newest first).
   */
  async *list(
    config: RunnableConfig,
    options?: CheckpointListOptions,
  ): AsyncGenerator<CheckpointTuple> {
    const { threadId, checkpointNs } = this.extractConfigurable(config)
    const { limit, before, filter } = options ?? {}

    const pattern = this.getCheckpointPattern(threadId, checkpointNs)
    const keys = await this.cache.keys(pattern)

    if (keys.length === 0) {
      return
    }

    // Sort by checkpoint_id (descending - newest first)
    const sortedKeys = keys.sort((a, b) => {
      const idA = a.split(':').pop()
      const idB = b.split(':').pop()
      if (!idA || !idB) {
        return 0 // Equal comparison for empty/undefined values
      }
      return idB.localeCompare(idA)
    })

    let count = 0
    for (const key of sortedKeys) {
      const checkpointIdPart = key.split(':').pop()
      if (!checkpointIdPart) continue

      const checkpointId = checkpointIdPart

      // Apply before filter
      if (before?.configurable?.checkpoint_id) {
        if (checkpointId >= before.configurable.checkpoint_id) {
          continue
        }
      }

      // Apply limit
      if (limit !== undefined) {
        if (count >= limit) {
          break
        }
      }

      // Get checkpoint tuple
      const checkpointConfig: RunnableConfig = {
        configurable: {
          thread_id: threadId,
          checkpoint_ns: checkpointNs,
          checkpoint_id: checkpointId,
        },
      }

      const tuple = await this.getTuple(checkpointConfig)
      if (!tuple) continue

      // Apply metadata filter
      if (filter && tuple.metadata) {
        let matches = true
        for (const [filterKey, filterValue] of Object.entries(filter)) {
          if (
            (tuple.metadata as Record<string, unknown>)[filterKey] !==
            filterValue
          ) {
            matches = false
            break
          }
        }
        if (!matches) continue
      }

      yield tuple
      count++
    }
  }

  /**
   * Save a checkpoint to storage
   * This method saves a checkpoint to the cache. The checkpoint is associated
   * with the provided config and its parent config (if any).
   */
  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _newVersions: ChannelVersions,
  ): Promise<RunnableConfig> {
    const { threadId, checkpointNs } = this.extractConfigurable(config)
    const checkpointId = checkpoint.id

    // Serialize checkpoint and metadata
    const [, serializedCheckpoint] = this.serde.dumpsTyped(checkpoint)
    const [, serializedMetadata] = this.serde.dumpsTyped(metadata)

    // Store checkpoint and metadata
    const checkpointKey = this.getCheckpointKey(
      threadId,
      checkpointNs,
      checkpointId,
    )
    const metadataKey = this.getMetadataKey(
      threadId,
      checkpointNs,
      checkpointId,
    )

    await Promise.all([
      this.cache.set(checkpointKey, serializedCheckpoint),
      this.cache.set(metadataKey, serializedMetadata),
    ])

    // Return the config with the checkpoint_id
    return {
      configurable: {
        thread_id: threadId,
        checkpoint_ns: checkpointNs,
        checkpoint_id: checkpointId,
      },
    }
  }

  /**
   * Store intermediate writes linked to a checkpoint
   * This method saves intermediate writes associated with a checkpoint to the cache.
   */
  async putWrites(
    config: RunnableConfig,
    writes: PendingWrite[],
    taskId: string,
  ): Promise<void> {
    const { threadId, checkpointNs, checkpointId } =
      this.extractConfigurable(config)

    if (!checkpointId) {
      throw new Error('Missing checkpoint_id in config.configurable')
    }

    // Convert PendingWrite to CheckpointPendingWrite format: [taskId, channel, value]
    const checkpointWrites: CheckpointPendingWrite[] = writes.map((write) => [
      taskId,
      write[0], // channel
      write[1], // value
    ])

    // Serialize and store writes
    const [, serializedWrites] = this.serde.dumpsTyped(checkpointWrites)
    const writesKey = this.getWritesKey(
      threadId,
      checkpointNs,
      checkpointId,
      taskId,
    )

    await this.cache.set(writesKey, serializedWrites)
  }

  /**
   * Delete a thread and all its associated checkpoints
   * This method is not part of the BaseCheckpointSaver interface but is useful for cleanup
   */
  async deleteThread(threadId: string, checkpointNs = ''): Promise<void> {
    const patterns = [
      `${this.keyPrefix}:checkpoint:${threadId}:${checkpointNs}:*`,
      `${this.keyPrefix}:metadata:${threadId}:${checkpointNs}:*`,
      `${this.keyPrefix}:writes:${threadId}:${checkpointNs}:*`,
    ]

    for (const pattern of patterns) {
      const keys = await this.cache.keys(pattern)
      await Promise.all(keys.map((key) => this.cache.delete(key)))
    }
  }

  /**
   * Clear all checkpoints from storage
   * This method is not part of the BaseCheckpointSaver interface but is useful for cleanup
   */
  async clearAll(): Promise<void> {
    const patterns = [
      `${this.keyPrefix}:checkpoint:*`,
      `${this.keyPrefix}:metadata:*`,
      `${this.keyPrefix}:writes:*`,
    ]

    for (const pattern of patterns) {
      const keys = await this.cache.keys(pattern)
      await Promise.all(keys.map((key) => this.cache.delete(key)))
    }
  }
}
