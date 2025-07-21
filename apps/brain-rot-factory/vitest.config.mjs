import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.next', 'coverage'],
    coverage: {
      exclude: [
        'node_modules/**',
        'dist/**',
        '.next/**',
        'coverage/**',
        '**/*.config.*',
        '**/*.test.*',
        '**/*.spec.*',
        '**/types/**',
        '**/__tests__/**',
        '**/test/**',
        '**/tests/**',
      ],
      include: ['src/**/*.{ts,tsx}'],
      excludeNodeModules: true,
      cleanOnRerun: true,
      all: true,
      reporter: ['text', 'json', 'html'],
    },
  },
})
