import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import { config } from '@repo/eslint-config/base'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...config,
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Allow default exports for Next.js pages and layouts
      'import/no-default-export': 'off',
      // Allow local TypeScript modules without .js extension in Next.js
      'file-extension-in-import-ts/file-extension-in-import-ts': 'off',
    },
  },
]

export default eslintConfig
