import { createReactAgent, ToolNode } from '@langchain/langgraph/prebuilt'

import { createModel as initModel } from './factories/model.js'
import type { AgentOptions, ModelOptions, Providers } from './types.js'

export * from './checkpointers/index.js'
export * from './tts/openai-tts.js'
export * from './tts/voice-config.js'
export * from './types.js'

export const createModel = <P extends Providers>(options: ModelOptions<P>) =>
  initModel(options)

export const createAgent = <P extends Providers>(options: AgentOptions<P>) => {
  const tools = new ToolNode(options.tools ?? [])
  const llm = options.llm ?? createModel(options)

  return createReactAgent({
    name: options.name,
    checkpointSaver: options.checkpointSaver,
    llm,
    tools,
  })
}
