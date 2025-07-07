import type { BaseChatModel } from '@langchain/core/language_models/chat_models'

import { DeepSeekProvider, OpenAiProvider } from '../providers/index.js'
import type { ModelOptions, ProviderRegistry, Providers } from '../types.js'

/**
 * Type-safe provider registry with automatic type inference.
 * Each provider implements the correct interface with proper type safety.
 */
const registry: ProviderRegistry = {
  openai: new OpenAiProvider(),
  deepseek: new DeepSeekProvider(),
}

/**
 * Create a model instance with full type safety and options support.
 * The function automatically infers the correct types from the provider implementation.
 */
export function createModel<P extends Providers>(
  opts: ModelOptions<P>,
): BaseChatModel {
  const provider = registry[opts.provider]
  if (!provider) {
    throw new Error(`Unknown provider: ${opts.provider}`)
  }

  // TypeScript now knows the exact types for model and options based on the provider
  return provider.create(opts.model, opts.options)
}
