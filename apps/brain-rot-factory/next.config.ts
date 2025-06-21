import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  // Transpile internal packages for monorepo support
  transpilePackages: ['@repo/ai', '@repo/cache', '@repo/utils'],

  // Environment variables
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    DEFAULT_PROVIDER: process.env.DEFAULT_PROVIDER,
    DEEPSEEK_API_URL: process.env.DEEPSEEK_API_URL,
    DEFAULT_MODEL: process.env.DEFAULT_MODEL,
  },
}

export default withNextIntl(nextConfig)
