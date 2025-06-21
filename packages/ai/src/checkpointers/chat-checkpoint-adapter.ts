import type { BaseMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { PendingWrite } from '@langchain/langgraph-checkpoint'
import type { CacheAdapter } from '@repo/cache'

import { PersistentCheckpointSaver } from './persistent-checkpoint-saver.js'

/**
 * Configuration options for the chat adapter
 */
export interface ChatAdapterConfig {
  /**
   * Maximum number of messages to keep in memory
   * @default 50
   */
  maxMessages?: number

  /**
   * TTL for conversation data in milliseconds
   * @default 7 days (604800000 ms)
   */
  conversationTtl?: number

  /**
   * Whether to automatically summarize old conversations
   * @default false
   */
  autoSummarize?: boolean

  /**
   * Number of messages before triggering summarization
   * @default 30
   */
  summarizeAfter?: number
}

/**
 * Chat conversation metadata
 */
export interface ChatConversationMetadata {
  characterId: string
  userId?: string | null
  conversationTitle?: string
  messageCount: number
  lastActivity: number
  createdAt: number
}

/**
 * Chat message with additional metadata
 */
export interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  characterId: string
  metadata?: Record<string, unknown>
}

/**
 * A specialized checkpoint saver adapter for chat conversations.
 * This extends the PersistentCheckpointSaver with chat-specific functionality:
 * - Message history management
 * - Conversation metadata tracking
 * - Automatic conversation cleanup
 * - Message counting and limits
 * - Character-specific conversation organization
 */
export class ChatCheckpointAdapter extends PersistentCheckpointSaver {
  private config: Required<ChatAdapterConfig>

  constructor(
    cache: CacheAdapter,
    keyPrefix = 'chat',
    config: ChatAdapterConfig = {},
  ) {
    super(cache, keyPrefix)
    this.config = {
      maxMessages: 50,
      conversationTtl: 7 * 24 * 60 * 60 * 1000, // 7 days
      autoSummarize: false,
      summarizeAfter: 30,
      ...config,
    }
  }

  /**
   * Generate conversation metadata key
   */
  private getConversationMetadataKey(threadId: string): string {
    return `${this.keyPrefix}:conversation:${threadId}:metadata`
  }

  /**
   * Generate conversation messages key
   */
  private getConversationMessagesKey(threadId: string): string {
    return `${this.keyPrefix}:conversation:${threadId}:messages`
  }

  /**
   * Store conversation metadata
   */
  async updateConversationMetadata(
    threadId: string,
    metadata: Partial<ChatConversationMetadata>,
  ): Promise<void> {
    const key = this.getConversationMetadataKey(threadId)
    const existing = await this.cache.get<ChatConversationMetadata>(key)

    const updated: ChatConversationMetadata = {
      characterId: '',
      messageCount: 0,
      createdAt: Date.now(),
      ...existing,
      ...metadata,
      lastActivity: Date.now(),
    }

    await this.cache.set(key, updated, this.config.conversationTtl)
  }

  /**
   * Get conversation metadata
   */
  async getConversationMetadata(
    threadId: string,
  ): Promise<ChatConversationMetadata | null> {
    const key = this.getConversationMetadataKey(threadId)
    return (await this.cache.get<ChatConversationMetadata>(key)) || null
  }

  /**
   * Add a message to the conversation history
   */
  async addMessage(threadId: string, message: ChatMessage): Promise<void> {
    const messagesKey = this.getConversationMessagesKey(threadId)

    // Get existing messages
    const existingMessages =
      (await this.cache.get<ChatMessage[]>(messagesKey)) || []

    // Add new message
    const updatedMessages = [...existingMessages, message]

    // Trim to max messages if needed
    const trimmedMessages = updatedMessages.slice(-this.config.maxMessages)

    // Store updated messages
    await this.cache.set(
      messagesKey,
      trimmedMessages,
      this.config.conversationTtl,
    )

    // Update conversation metadata
    await this.updateConversationMetadata(threadId, {
      characterId: message.characterId,
      messageCount: trimmedMessages.length,
      conversationTitle: this.generateConversationTitle(trimmedMessages),
    })
  }

  /**
   * Get conversation messages
   */
  async getMessages(threadId: string): Promise<ChatMessage[]> {
    const key = this.getConversationMessagesKey(threadId)
    return (await this.cache.get<ChatMessage[]>(key)) || []
  }

  /**
   * Get recent conversation context for AI prompts
   */
  async getConversationContext(
    threadId: string,
    maxMessages = 10,
  ): Promise<string> {
    const messages = await this.getMessages(threadId)
    const recentMessages = messages.slice(-maxMessages)

    if (recentMessages.length === 0) {
      return ''
    }

    const contextMessages = recentMessages
      .map((msg) => {
        const role = msg.type === 'user' ? 'User' : 'Assistant'
        return `${role}: ${msg.content}`
      })
      .join('\n')

    return `\n\nPREVIOUS CONVERSATION CONTEXT:\n${contextMessages}\n\nPlease continue this conversation naturally, staying in character and referencing previous context when appropriate.`
  }

  /**
   * Generate a conversation title from messages
   */
  private generateConversationTitle(messages: ChatMessage[]): string {
    const firstUserMessage = messages.find((m) => m.type === 'user')
    if (firstUserMessage) {
      const title = firstUserMessage.content.trim()
      return title.length > 50 ? `${title.slice(0, 50)}...` : title
    }
    const characterId = messages[0]?.characterId || 'character'
    return `Conversation with ${characterId}`
  }

  /**
   * Clear conversation data
   */
  async clearConversation(threadId: string): Promise<void> {
    const metadataKey = this.getConversationMetadataKey(threadId)
    const messagesKey = this.getConversationMessagesKey(threadId)

    await Promise.all([
      this.cache.delete(metadataKey),
      this.cache.delete(messagesKey),
    ])
  }

  /**
   * Get conversation summaries for a user or character
   */
  async getConversationSummaries(
    characterId?: string,
    userId?: string,
  ): Promise<Array<ChatConversationMetadata & { threadId: string }>> {
    // Get all conversation metadata keys
    const pattern = `${this.keyPrefix}:conversation:*:metadata`
    const keys = await this.cache.keys(pattern)

    const summaries: Array<ChatConversationMetadata & { threadId: string }> = []

    for (const key of keys) {
      const metadata = await this.cache.get<ChatConversationMetadata>(key)
      if (metadata) {
        // Extract threadId from key
        const threadId = key.split(':')[2] || ''

        // Filter by characterId or userId if provided
        if (characterId && metadata.characterId !== characterId) continue
        if (userId && metadata.userId !== userId) continue

        summaries.push({
          ...metadata,
          threadId,
        })
      }
    }

    // Sort by last activity (most recent first)
    return summaries.sort((a, b) => b.lastActivity - a.lastActivity)
  }

  /**
   * Cleanup old conversations
   */
  async cleanupOldConversations(olderThanMs?: number): Promise<number> {
    const cutoff = olderThanMs || this.config.conversationTtl
    const cutoffTime = Date.now() - cutoff

    const summaries = await this.getConversationSummaries()
    let deletedCount = 0

    for (const summary of summaries) {
      if (summary.lastActivity < cutoffTime) {
        await this.clearConversation(summary.threadId)
        deletedCount++
      }
    }

    return deletedCount
  }

  /**
   * Override the putWrites method to also track chat messages
   * This ensures that when new checkpoint writes are saved, we also update the chat message history
   */
  async putWrites(
    config: RunnableConfig,
    writes: PendingWrite[],
    taskId: string,
  ): Promise<void> {
    // Call the parent method first
    await super.putWrites(config, writes, taskId)

    // Extract thread ID for chat message tracking
    const threadId = config.configurable?.thread_id
    if (!threadId) return

    // Process writes to extract chat messages
    // PendingWrite is a tuple: [channel, value]
    for (const write of writes) {
      const [channel, value] = write
      if (channel === 'messages' && Array.isArray(value)) {
        // Extract BaseMessage objects and convert to ChatMessage
        for (const message of value) {
          if (this.isBaseMessage(message)) {
            const chatMessage: ChatMessage = {
              id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: message._getType() === 'human' ? 'user' : 'assistant',
              content: message.content.toString(),
              timestamp: Date.now(),
              characterId: config.configurable?.character_id || 'unknown',
              metadata: message.additional_kwargs,
            }

            await this.addMessage(threadId, chatMessage)
          }
        }
      }
    }
  }

  /**
   * Type guard to check if an object is a BaseMessage
   */
  private isBaseMessage(obj: unknown): obj is BaseMessage {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'content' in obj &&
      '_getType' in obj &&
      typeof (obj as BaseMessage)._getType === 'function'
    )
  }
}
