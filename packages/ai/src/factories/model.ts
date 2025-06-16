import type { BaseChatModel } from '@langchain/core/language_models/chat_models'

import { DeepSeekProvider, OpenAiProvider } from '../providers/index.js'
import type {
  LlmProvider,
  ModelOptions,
  ProviderModels,
  Providers,
} from '../types.js'

const registry: {
  [P in Providers]: LlmProvider<ProviderModels[P]>
} = {
  openai: new OpenAiProvider(),
  deepseek: new DeepSeekProvider(),
}

export function createModel<P extends Providers>(
  opts: ModelOptions<P>,
): BaseChatModel {
  const provider = registry[opts.provider] as LlmProvider<ProviderModels[P]>
  if (!provider) throw new Error(`Unknown provider: ${opts.provider}`)
  return provider.create(opts.model)
}
