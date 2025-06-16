# Brain Rot Factory 🧠🏭

A Next.js web application that serves as your AI-powered companion for generating the most unhinged, chaotic, and absolutely brain-rotting content imaginable.

## Features

- 🎨 **Modern UI**: Beautiful gradient interface with glass morphism effects
- 🤖 **AI Integration**: Powered by the `@repo/ai` package from the Vibecode Playground monorepo
- ⚡ **Real-time Chat**: Interactive chat interface for maximum brain rot generation
- 🎭 **Chaotic Responses**: Pre-loaded with hilariously unhinged AI responses
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **Monorepo Integration** - Uses shared packages from the Vibecode Playground ecosystem

## Development

```bash
# From the monorepo root
npm run dev

# Or run specifically for this app
cd apps/brain-rot-assistant
npm run dev
```

The app will be available at `http://localhost:3000`.

## API Routes

- `POST /api/chat` - Main chat endpoint for generating brain rot content

## Integration with Monorepo

This app leverages several packages from the Vibe Rot monorepo:

- `@repo/ai` - AI capabilities and LangChain integration
- `@repo/cache` - Caching system for responses
- `@repo/logger` - Structured logging
- `@repo/utils` - Utility functions
- `@repo/eslint-config` - Shared ESLint configuration
- `@repo/typescript-config` - Shared TypeScript configuration

## Environment Variables

```bash
OPENAI_API_KEY=      # For AI functionality
DEEPSEEK_API_URL=    # DeepSeek API
DEEPSEEK_API_KEY=    # DeepSeek key
```

## Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint code
npm run clean        # Clean build artifacts
```

---

*Part of the Vibe Rot monorepo - Modern TypeScript monorepo with Turbo for high-performance builds.*
