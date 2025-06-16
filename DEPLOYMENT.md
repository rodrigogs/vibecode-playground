# Vercel Deployment Guide

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rodrigogs/vibecode-playground&project-name=vibecode-playground&repository-name=vibecode-playground)

## Manual Deployment Steps

### 1. Deploy from GitHub
1. Go to [vercel.com/new](https://vercel.com/new)
2. Select "Import Git Repository"
3. Choose `rodrigogs/vibecode-playground`
4. Configure project settings:
   - **Framework**: Next.js
   - **Root Directory**: `apps/brain-rot-factory`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm ci`

### 2. Environment Variables
Add these in your Vercel project settings:

```bash
OPENAI_API_KEY=your_openai_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEFAULT_PROVIDER=deepseek
DEEPSEEK_API_URL=https://api.deepseek.com
DEFAULT_MODEL=deepseek-chat
```

### 3. Build Settings
The project is configured with:
- **Node.js Version**: 20.x (latest LTS)
- **Package Manager**: npm
- **Monorepo Support**: Enabled

### 4. Domain Setup
Once deployed, you can:
- Use the provided `.vercel.app` domain
- Add a custom domain in project settings
- Configure DNS records if needed

## Deployment via CLI

If you prefer using the CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

## Troubleshooting

### Build Issues
- Ensure all dependencies are in `package.json`
- Check that TypeScript compiles without errors
- Verify environment variables are set

### API Routes
- API routes are in `apps/brain-rot-factory/src/app/api/`
- Make sure they export named functions (GET, POST, etc.)
- Environment variables must be set for AI providers

### Monorepo Setup
- The project uses Turborepo for monorepo management
- All packages are built before the Next.js app
- Internal packages are linked via workspace dependencies
