import type { ChatOpenAICallOptions } from '@langchain/openai'
import { ChatOpenAI } from '@langchain/openai'

import type { LlmProvider, OpenAIModels } from '../types.js'

/**
 * OpenAI provider implementation with automatic type inference.
 * This class automatically inherits the correct types from ChatOpenAI's constructor.
 */
export class OpenAiProvider implements LlmProvider<'openai'> {
  create(model: OpenAIModels, options: ChatOpenAICallOptions = {}): ChatOpenAI {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is missing')
    }

    // Merge the model with options, ensuring model takes precedence
    const chatOpenAIOptions = {
      apiKey: process.env.OPENAI_API_KEY,
      ...options,
      model, // Model passed separately takes precedence
    }

    return new ChatOpenAI(chatOpenAIOptions)
  }
}
