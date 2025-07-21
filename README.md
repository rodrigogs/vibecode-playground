<div align="center">
  <img src="media/logo.png" alt="Brain-rot Factory Logo" width="200" height="200">
  
  # Vibecode Playground
  
  [![CI](https://github.com/rodrigogs/vibecode-playground/workflows/CI/badge.svg)](https://github.com/rodrigogs/vibecode-playground/actions)
  [![codecov](https://codecov.io/gh/rodrigogs/vibecode-playground/branch/main/graph/badge.svg)](https://codecov.io/gh/rodrigogs/vibecode-playground)
</div>

Modern TypeScript monorepo with Turbo for high-performance builds. Chat with AI-powered Italian brain-rot meme characters! 🧠💬

**Features:**
- 🤖 AI-powered chat with brain-rot characters
- 🎵 Text-to-speech with audio distortion
- 🎁 Rewarded ads system (prepared, currently inactive)
- 🌍 Multi-language support (EN, IT, PT, ID, JA, ZH)
- 🔐 GitHub OAuth authentication
- 📊 Analytics and performance monitoring
- ⚖️ LGPD compliant privacy policies

## Structure

```bash
├── apps/
│   ├── brain-rot-factory/        # Next.js web app with AI chat interface  
│   └── brain-rot-crawler/        # Web scraper for content collection
├── packages/
│   ├── ai/                       # AI agents with LangChain
│   ├── cache/                    # Caching system (memory/filesystem)
│   ├── logger/                   # Structured logging
│   ├── utils/                    # File and time utilities
│   ├── template/                 # Package template
│   ├── eslint-config/            # Shared ESLint configs
│   ├── typescript-config/        # Shared TypeScript configs
│   └── test/                     # Shared Vitest config
```

## Stack

- **Turbo** - Monorepo orchestration
- **TypeScript** - Dual ESM/CJS builds
- **Vitest** - Testing with coverage
- **ESLint** - Linting with shared configs
- **LangChain** - AI capabilities

## Quick Start

```bash
git clone https://github.com/rodrigogs/vibecode-playground.git
cd vibecode-playground
npm install
npm run build
```

## Commands

```bash
npm run build         # Build all packages
npm run dev          # Development mode
npm test             # Run tests
npm run lint         # Lint code
```

## Environment

```bash
# AI Functionality
OPENAI_API_KEY=      # For AI functionality
DEEPSEEK_API_URL=    # DeepSeek API
DEEPSEEK_API_KEY=    # DeepSeek key

# Authentication  
AUTH_SECRET=         # NextAuth.js secret
GITHUB_ID=          # GitHub OAuth client ID
GITHUB_SECRET=      # GitHub OAuth secret

# Features
ENABLE_REWARDS=     # Enable rewarded ads (default: false, currently inactive)
```

## Legal & Compliance

This project includes comprehensive legal documentation and LGPD compliance:
- [Legal Information](./LEGAL.md) - Complete legal overview
- [Privacy Policies](./apps/brain-rot-factory/src/app/[locale]/privacy/) - Multi-language privacy policies
- [Terms of Service](./apps/brain-rot-factory/src/app/[locale]/terms/) - Service terms and conditions
- [MIT License](./LICENSE) - Open source license

## Packages

| Package                   | Description                          |
| ------------------------- | ------------------------------------ |
| `@repo/ai`                | AI agents with LangChain integration |
| `@repo/cache`             | Memory and filesystem caching        |
| `@repo/logger`            | Structured logging with debug        |
| `@repo/utils`             | File and time utilities              |
| `@repo/template`          | Package creation template            |
| `@repo/eslint-config`     | Shared ESLint configurations         |
| `@repo/typescript-config` | Shared TypeScript configurations     |
| `@repo/test`              | Shared Vitest testing utilities      |
