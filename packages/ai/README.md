# @repo/ai

A comprehensive LangChain wrapper library providing factory functions for creating chat models, React agents, and persistent checkpoint savers. Supports OpenAI and DeepSeek providers with full TypeScript support.

## Features

- 🤖 **Multi-Provider Support**: OpenAI and DeepSeek models
- 🛠️ **React Agents**: Pre-configured LangGraph React agents with tool support
- 💾 **Persistent Memory**: Custom checkpoint saver with cache backend integration
- 🔧 **Type-Safe**: Full TypeScript support with provider-specific model types
- 🏗️ **Factory Pattern**: Simple, consistent API for creating AI components

## Installation

```bash
npm install @repo/ai
```

## Quick Start

```typescript
import { createAgent } from '@repo/ai'
import { HumanMessage } from '@langchain/core/messages'

// Create a basic agent
const agent = createAgent({
  name: 'assistant',
  provider: 'openai',
  model: 'gpt-4o'
})

// Use the agent
const response = await agent.invoke({
  messages: [new HumanMessage('Hello, world!')]
})
```

## API Reference

### createModel

Create a chat model from supported providers.

```typescript
import { createModel } from '@repo/ai'

// OpenAI models
const openai = createModel({
  provider: 'openai',
  model: 'gpt-4o' // 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4o' | 'gpt-4o-mini'
})

// DeepSeek models  
const deepseek = createModel({
  provider: 'deepseek',
  model: 'deepseek-chat' // 'deepseek-chat' | 'deepseek-reasoner'
})
```

### createAgent

Create a React agent with optional tools and memory persistence.

```typescript
import { createAgent } from '@repo/ai'
import { MemorySaver } from '@langchain/langgraph'
import { TavilySearchResults } from '@langchain/community/tools/tavily_search'

// Basic agent
const agent = createAgent({
  name: 'assistant',
  provider: 'openai',
  model: 'gpt-4o'
})

// Agent with tools and memory
const agentWithTools = createAgent({
  name: 'search-assistant',
  provider: 'deepseek', 
  model: 'deepseek-chat',
  tools: [new TavilySearchResults({ maxResults: 3 })],
  checkpointSaver: new MemorySaver()
})

// Agent with custom LLM
const customAgent = createAgent({
  name: 'custom',
  llm: createModel({ provider: 'openai', model: 'gpt-4' })
})
```

### PersistentCheckpointSaver

A persistent checkpoint saver that integrates with the `@repo/cache` package for flexible storage backends.

```typescript
import { PersistentCheckpointSaver } from '@repo/ai'
import { MemoryCacheAdapter, FsCacheAdapter } from '@repo/cache'

// Create with memory cache adapter
const memoryCache = new MemoryCacheAdapter()
const memoryCheckpointSaver = new PersistentCheckpointSaver(memoryCache, 'my-app')

// Create with filesystem cache adapter
const fsCache = new FsCacheAdapter('/path/to/cache/dir')
const fsCheckpointSaver = new PersistentCheckpointSaver(fsCache, 'my-app')

// Use with agent
const agent = createAgent({
  name: 'persistent-agent',
  provider: 'openai',
  model: 'gpt-4o',
  checkpointSaver: memoryCheckpointSaver
})
```

## Environment Variables

Required environment variables:

```bash
# For OpenAI
OPENAI_API_KEY=your_openai_api_key

# For DeepSeek  
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_URL=https://api.deepseek.com
```

## Usage Examples

### Basic Chat

```typescript
import { createAgent } from '@repo/ai'
import { HumanMessage } from '@langchain/core/messages'

const agent = createAgent({
  name: 'chat-bot',
  provider: 'openai',
  model: 'gpt-4o'
})

const response = await agent.invoke({
  messages: [new HumanMessage('Hello!')]
})
```

### Agent with Tools

```typescript
import { createAgent } from '@repo/ai'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

const calculatorTool = new DynamicStructuredTool({
  name: 'calculator',
  description: 'Perform basic arithmetic',
  schema: z.object({
    expression: z.string().describe('Math expression to evaluate')
  }),
  func: async ({ expression }) => eval(expression).toString()
})

const agent = createAgent({
  name: 'math-assistant',
  provider: 'openai',
  model: 'gpt-4o',
  tools: [calculatorTool]
})
```

### Persistent Memory

```typescript
import { createAgent, PersistentCheckpointSaver } from '@repo/ai'
import { FsCacheAdapter } from '@repo/cache'
import { HumanMessage } from '@langchain/core/messages'

// Create a persistent checkpoint saver with filesystem cache
const fsCache = new FsCacheAdapter('./agent-memory')
const checkpointSaver = new PersistentCheckpointSaver(fsCache, 'chat-bot')

const agent = createAgent({
  name: 'memory-bot',
  provider: 'openai',
  model: 'gpt-4o',
  checkpointSaver
})

// Conversation with thread ID for persistence
const response = await agent.invoke(
  { messages: [new HumanMessage('My name is Alice')] },
  { configurable: { thread_id: 'user-123' } }
)

// Later conversation in the same thread will remember the name
const response2 = await agent.invoke(
  { messages: [new HumanMessage('What is my name?')] },
  { configurable: { thread_id: 'user-123' } }
)

// Note: thread_id is required when using checkpointSaver for memory persistence
```
