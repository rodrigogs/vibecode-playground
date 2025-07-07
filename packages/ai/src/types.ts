import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { StructuredToolInterface } from '@langchain/core/tools'
import type { BaseCheckpointSaver } from '@langchain/langgraph'
import type { ChatOpenAICallOptions } from '@langchain/openai'

export type Providers = 'openai' | 'deepseek'

export type OpenAIModels =
  | 'gpt-3.5-turbo'
  | 'gpt-4'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4o-audio-preview'

export type OpenAITTSModels = 'gpt-4o-mini-tts' | 'tts-1' | 'tts-1-hd'

export type OpenAITTSVoices =
  | 'alloy'
  | 'ash'
  | 'ballad'
  | 'coral'
  | 'echo'
  | 'fable'
  | 'onyx'
  | 'nova'
  | 'sage'
  | 'shimmer'
  | 'verse'

export type OpenAITTSOutputFormats =
  | 'mp3'
  | 'opus'
  | 'aac'
  | 'flac'
  | 'wav'
  | 'pcm'

export type DeepseekModels = 'deepseek-chat' | 'deepseek-reasoner'

export type ProviderModels = {
  openai: OpenAIModels
  deepseek: DeepseekModels
}

export type Model = OpenAIModels | DeepseekModels

// ============================================================================
// TYPE INFERENCE SYSTEM WITH AUTOMATIC OPTION EXTRACTION
// ============================================================================

/**
 * OpenAI model options with automatic type inference.
 * All valid ChatOpenAI options are automatically available with full IntelliSense.
 */
export type OpenAIModelOptions = Omit<ChatOpenAICallOptions, 'model'> & {
  model?: OpenAIModels // Make model optional since we pass it separately
}

/**
 * DeepSeek uses OpenAI-compatible API, so it inherits all OpenAI options.
 */
export type DeepseekModelOptions = Omit<ChatOpenAICallOptions, 'model'> & {
  model?: DeepseekModels // Make model optional since we pass it separately
}

/**
 * Provider model options mapping for type safety.
 */
export type ProviderModelOptions = {
  openai: OpenAIModelOptions
  deepseek: DeepseekModelOptions
}

/**
 * Generic model options that work with any provider.
 * TypeScript will enforce correct options based on the provider.
 */
export type ModelOptions<P extends Providers = Providers> = {
  provider: P
  model: ProviderModels[P]
  options?: ProviderModelOptions[P]
}

/**
 * Agent options extending model options with agent-specific properties.
 */
export type AgentOptions<P extends Providers = Providers> = ModelOptions<P> & {
  name: string
  llm?: BaseChatModel
  tools?: StructuredToolInterface[]
  checkpointSaver?: BaseCheckpointSaver
}

/**
 * Generic LlmProvider interface with type-safe implementations.
 * Each provider must implement this interface with proper typing.
 */
export type LlmProvider<P extends Providers> = {
  create(
    model: ProviderModels[P],
    options?: ProviderModelOptions[P],
  ): BaseChatModel
}

/**
 * Type-safe provider registry interface.
 * Ensures each provider implements the correct interface.
 */
export type ProviderRegistry = {
  [P in Providers]: LlmProvider<P>
}

// ============================================================================
// TTS (TEXT-TO-SPEECH) TYPES
// ============================================================================

export type TTSOptions = {
  model?: OpenAITTSModels
  voice?: OpenAITTSVoices
  instructions?: string // Only works with gpt-4o-mini-tts
  speed?: number // 0.25 to 4.0, does not work with gpt-4o-mini-tts
  response_format?: OpenAITTSOutputFormats
}

export type TTSResponse = {
  audio: Buffer
  format: OpenAITTSOutputFormats
  model: OpenAITTSModels
  voice: OpenAITTSVoices
}
