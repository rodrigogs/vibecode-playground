import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { StructuredToolInterface } from '@langchain/core/tools'
import type { BaseCheckpointSaver } from '@langchain/langgraph'

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

export type ModelOptions<P extends Providers = Providers> = {
  provider: P
  model: ProviderModels[P]
}

export type AgentOptions<P extends Providers = Providers> = ModelOptions<P> & {
  name: string
  llm?: BaseChatModel
  tools?: StructuredToolInterface[]
  checkpointSaver?: BaseCheckpointSaver
}

export type LlmProvider<M extends Model = Model> = {
  create(model: M): BaseChatModel
}

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
