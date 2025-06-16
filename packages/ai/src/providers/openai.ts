import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { ChatOpenAI } from '@langchain/openai'

import type { LlmProvider, OpenAIModels } from '../types.js'

export class OpenAiProvider implements LlmProvider<OpenAIModels> {
  create(model: OpenAIModels): BaseChatModel {
    if (!process.env.OPENAI_API_KEY)
      throw new Error('OPENAI_API_KEY is missing')
    return new ChatOpenAI({ apiKey: process.env.OPENAI_API_KEY, model })
  }
}
