import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { ChatOpenAI as ChatDeepSeek } from '@langchain/openai' // DeepSeek is OpenAI-compatible

import type { DeepseekModels, LlmProvider } from '../types.js'

export class DeepSeekProvider implements LlmProvider<DeepseekModels> {
  create(model: DeepseekModels): BaseChatModel {
    if (!process.env.DEEPSEEK_API_KEY)
      throw new Error('DEEPSEEK_API_KEY is missing')
    return new ChatDeepSeek({
      apiKey: process.env.DEEPSEEK_API_KEY,
      configuration: { baseURL: process.env.DEEPSEEK_API_URL },
      model,
    })
  }
}
