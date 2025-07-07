import type { ChatOpenAICallOptions } from '@langchain/openai'
import { ChatOpenAI as ChatDeepSeek } from '@langchain/openai' // DeepSeek is OpenAI-compatible

import type { DeepseekModels, LlmProvider } from '../types.js'

/**
 * DeepSeek provider implementation with automatic type inference.
 * Since DeepSeek uses OpenAI-compatible API, it inherits ChatOpenAI's options automatically.
 */
export class DeepSeekProvider implements LlmProvider<'deepseek'> {
  create(
    model: DeepseekModels,
    options: ChatOpenAICallOptions = {},
  ): ChatDeepSeek {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is missing')
    }

    // Merge DeepSeek-specific configuration with user options
    const deepSeekOptions = {
      apiKey: process.env.DEEPSEEK_API_KEY,
      configuration: { baseURL: process.env.DEEPSEEK_API_URL },
      ...options,
      model, // Model passed separately takes precedence
    }

    return new ChatDeepSeek(deepSeekOptions)
  }
}
