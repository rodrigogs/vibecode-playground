# Digital Companion CLI

Interactive AI-powered terminal application showcasing monorepo package integration. Features a conversational AI agent with built-in tools, beautiful terminal UI, and persistent memory.

## Overview

The Digital Companion is a LangChain-powered CLI app that demonstrates real-world usage of the monorepo packages:

- **@repo/ai**: Creates intelligent agents with tool integration
- **@repo/cache**: Persistent storage for agent memory using filesystem cache
- **@repo/logger**: Structured logging throughout the application  
- **Beautiful UI**: Rich terminal interface with ASCII art, colors, and animations
- **Tool System**: Extensible agent capabilities with 7 built-in tools
- **Memory**: Persistent conversation history that survives app restarts

## Features

### 🤖 AI Agent Capabilities
- **Conversational AI**: Powered by OpenAI GPT-4o-mini or DeepSeek models
- **Tool Integration**: Agent can use tools to perform tasks and calculations
- **Persistent Memory**: Conversation history saved to filesystem, survives app restarts
- **Error Handling**: Graceful error recovery and user feedback

### 🎪 Built-in Tools
- **Joke Generator**: Programming and dad jokes
- **ASCII Art Creator**: Generate art for cats, robots, hearts, stars, etc.
- **Calculator**: Mathematical expressions, functions, constants
- **Dice Roller**: Roll multiple dice with different sides
- **Coin Flipper**: Flip multiple coins with results
- **Writing Prompts**: Creative writing inspiration
- **Color Generator**: Random colors with fun facts

### 🎨 Rich Terminal UI
- **Figlet ASCII Art**: Large title text with gradient colors
- **Boxed Content**: Formatted messages and responses
- **Loading Spinners**: Visual feedback during AI processing  
- **Interactive Menus**: Keyboard navigation with descriptions
- **Color Coding**: Different colors for different content types

### 💾 Persistent Memory

The Digital Companion uses filesystem-based persistent memory powered by `@repo/cache` and `@repo/ai`:

```typescript
// Memory is automatically saved to ./agent-memory/ directory
// Conversations persist across app restarts
// Each user session maintains its conversation history

// The agent remembers:
// - Previous conversations in the same session
// - Tool usage and results
// - User preferences and context
// - Multi-turn conversation flow
```

**Memory Features:**
- **Automatic**: No manual save/load required
- **Thread-based**: Each conversation thread maintains separate history
- **Persistent**: Survives application restarts and crashes
- **Efficient**: Only stores necessary conversation state
- **Secure**: Local filesystem storage, no external dependencies

**Storage Location:**
- Memory files: `./agent-memory/` (gitignored)
- Thread ID: `digital-companion-session`
- Cache prefix: `digital-companion`

## Usage

```bash
# Quick start
npm run start

# Development with debug output
npm run dev

# Build first, then run
npm run build && npm run start
```

### Environment Setup

The app supports multiple AI providers:

```bash
# Option 1: OpenAI (recommended)
export OPENAI_API_KEY="sk-your-openai-key"

# Option 2: DeepSeek (alternative)
export DEEPSEEK_API_KEY="your-deepseek-key"
export DEEPSEEK_API_URL="https://api.deepseek.com"
```

## Application Flow

### 1. Welcome Screen
Beautiful ASCII art title with available tools overview and colorful formatting.

### 2. Main Menu Options
- **💬 Chat Mode**: Continuous conversation with the AI agent
- **🎯 Quick Tasks**: Pre-built creative prompts using multiple tools
- **👋 Exit**: Graceful application termination

### 3. Chat Mode
- Type messages to interact with the AI
- Agent can use tools autonomously based on conversation
- Type `/q` to return to main menu
- Persistent memory across conversation

### 4. Quick Tasks
Pre-configured prompts that showcase tool combinations:
- "Tell me a joke and create ASCII art"
- "Roll dice, flip coins, and get a writing prompt"  
- "Math + Colors + Fun facts"
- "Cat ASCII art + Dad joke"
- "Space exploration writing prompt"
- "Surprise me with something creative!"

## Code Examples

### Basic Usage

```typescript
import { main, DigitalCompanionUI } from './index'

// Start the full application
await main()

// Or create a custom instance
const companion = new DigitalCompanionUI()
await companion.run()
```

### Using Individual Tools

```typescript
import { jokeGeneratorTool, calculatorTool, asciiArtTool } from './tools'

// Generate a programming joke
const joke = await jokeGeneratorTool.invoke({ type: 'programming' })

// Perform calculations  
const result = await calculatorTool.invoke({ expression: 'sqrt(144) + 2^3' })

// Create ASCII art
const art = await asciiArtTool.invoke({ subject: 'robot' })
```

### Package Integration

```typescript
import { createAgent } from '@repo/ai'
import { createLogger } from '@repo/logger'
import * as tools from './tools'

// Set up logging
const logger = createLogger('my-app')

// Create AI agent with tools
const agent = createAgent({
  provider: 'openai',
  model: 'gpt-4o-mini', 
  name: 'MyAgent',
  tools: Object.values(tools),
  checkpointSaver: new MemorySaver()
})

// Use the agent
const response = await agent.invoke({
  messages: [new HumanMessage('Tell me a joke and draw a cat')]
})
```

## Architecture

### Class Structure
- **DigitalCompanionUI**: Main application class handling UI and flow
- **Agent Integration**: LangChain agent with tool registry
- **Memory Management**: Persistent conversation state with LangGraph
- **Error Handling**: Graceful error recovery and user messaging

### Tool System
Each tool is a `DynamicStructuredTool` with:
- **Name & Description**: For agent tool selection
- **Zod Schema**: Type-safe input validation
- **Async Function**: Tool implementation logic

### UI Components
- **Welcome Screen**: Figlet + boxen + gradient colors
- **Menu System**: Inquirer prompts with descriptions
- **Response Display**: Formatted boxed output
- **Loading States**: Ora spinners during processing

## Development

### Adding New Tools

1. Create tool file in `src/tools/`:

```typescript
// src/tools/my-tool.ts
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

export const myTool = new DynamicStructuredTool({
  name: 'my_tool',
  description: 'Description of what this tool does',
  schema: z.object({
    input: z.string().describe('Input parameter')
  }),
  func: async ({ input }) => {
    // Tool implementation
    return `Processed: ${input}`
  }
})
```

2. Export from `src/tools/index.ts`:

```typescript
export { myTool } from './my-tool.js'
```

3. The tool is automatically available to the agent!

### Customizing UI

Modify constants in `index.ts`:
- `MAIN_MENU_CHOICES`: Update menu options
- `QUICK_TASK_CHOICES`: Add new preset prompts  
- `WELCOME_CONTENT`: Customize welcome message
- `WELCOME_BOX_OPTIONS`: Change styling

## Technical Details

- **TypeScript**: Full type safety with strict configuration
- **Dual Module**: ESM and CJS builds for compatibility
- **Testing**: Comprehensive unit and integration tests
- **Linting**: ESLint with shared configuration
- **Build System**: Concurrent TypeScript compilation
- **Dependencies**: Minimal runtime dependencies, extensive dev tooling
