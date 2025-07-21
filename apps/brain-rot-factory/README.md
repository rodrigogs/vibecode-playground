# Brain-rot Factory 🧠🏭

A Next.js web application that serves as your AI-powered companion for generating the most unhinged, chaotic, and absolutely brain-rotting content imaginable.

## Features

- 🎨 **Modern UI**: Beautiful gradient interface with glass morphism effects
- 🤖 **AI Integration**: Powered by the `@repo/ai` package from the Vibecode Playground monorepo
- ⚡ **Real-time Chat**: Interactive chat interface for maximum brain-rot generation
- 🎭 **Chaotic Responses**: AI-generated unhinged and brain-rot style content
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- 🔐 **Authentication**: GitHub OAuth integration with NextAuth.js
- 🌍 **Internationalization**: Multi-language support (EN, IT, PT, ID)
- 🎵 **Audio Features**: Text-to-speech with bizarre audio distortion effects
- 🎠 **Character Carousel**: Interactive character selection with Swiper
- 🎁 **Rewarded Ads**: AdMob integration prepared (currently inactive)
- 📊 **Analytics**: Vercel Analytics integration for usage insights

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **NextAuth.js** - Authentication system
- **Next-intl** - Internationalization
- **Lucide React** - Beautiful icons
- **Swiper** - Touch slider component
- **Monorepo Integration** - Uses shared packages from the Vibecode Playground ecosystem

## Development

```bash
# From the monorepo root
npm run dev

# Or run specifically for this app
cd apps/brain-rot-factory
npm run dev
```

The app will be available at `http://localhost:3000` (default Next.js port).

## API Routes

- `POST /api/chat` - Main chat endpoint for generating brain-rot content
- `POST /api/tts` - Text-to-speech generation with audio distortion
- `GET /api/rate-limit` - Check current rate limiting status
- `POST /api/rate-limit` - Update rate limiting
- `GET /api/rewarded-ad/generate-token` - Generate token for rewarded ads (inactive)
- `POST /api/rewarded-ad/grant-credit` - Grant credits after watching ads (inactive)
- `GET /api/auth/[...nextauth]` - NextAuth.js authentication  
- `GET /api/admin/rate-limit` - Admin rate limit management

## Integration with Monorepo

This app leverages several packages from the Vibecode Playground monorepo:

- `@repo/ai` - AI capabilities and LangChain integration
- `@repo/cache` - Caching system for responses
- `@repo/logger` - Structured logging
- `@repo/utils` - Utility functions
- `@repo/eslint-config` - Shared ESLint configuration
- `@repo/typescript-config` - Shared TypeScript configuration

## Environment Variables

```bash
# AI Functionality
OPENAI_API_KEY=       # Required for OpenAI features
DEEPSEEK_API_KEY=     # Optional - DeepSeek alternative AI

# Authentication
AUTH_SECRET=          # NextAuth.js secret key
GITHUB_ID=           # GitHub OAuth app client ID
GITHUB_SECRET=       # GitHub OAuth app client secret

# Features
ENABLE_REWARDS=       # Enable/disable reward system (default: false, currently inactive)

# Analytics  
VERCEL_ANALYTICS=     # Vercel Analytics integration (automatically enabled on Vercel)

# Optional
DATA_DIR=            # Custom data directory (defaults to ~/.brain-rot-factory)
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

*Part of the Vibecode Playground monorepo - Modern TypeScript monorepo with Turbo for high-performance builds.*

## Documentation

- [Audio Distortion System](./AUDIO_DISTORTION.md) - Comprehensive guide to the bizarre audio distortion engine
- [Authentication Setup](./AUTH_SETUP.md) - GitHub OAuth configuration and setup instructions
