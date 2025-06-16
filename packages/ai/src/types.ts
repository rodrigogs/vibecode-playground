import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { StructuredToolInterface } from '@langchain/core/tools'
import type { BaseCheckpointSaver } from '@langchain/langgraph'

export type Providers = 'openai' | 'deepseek'

export type OpenAIModels = 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4o' | 'gpt-4o-mini'
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
