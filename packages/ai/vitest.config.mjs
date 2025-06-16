import { defineConfig } from '@repo/test/vitest.config.mjs'
import dotenv from 'dotenv'

const dirname = import.meta.dirname
const envPath = `${dirname}/.env.test.local`

const { parsed: env } = dotenv.config({ path: envPath })

export default defineConfig({
  env: {
    ...env,
  },
  testTimeout: 30000,
})
