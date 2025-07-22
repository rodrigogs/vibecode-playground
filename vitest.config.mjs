import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Run only packages tests for coverage, excluding brain-rot-factory due to path mapping issues
    include: ['packages/**/src/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      'apps/brain-rot-factory/**', // Exclude for now due to path mapping issues
    ],
    coverage: {
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**',
        '**/coverage/**',
        '**/*.config.*',
        '**/*.test.*',
        '**/*.spec.*',
        '**/types/**',
        '**/__tests__/**',
        '**/test/**',
        '**/tests/**',
        'apps/brain-rot-factory/**', // Exclude from coverage for now
      ],
      include: ['packages/**/src/**/*.{ts,tsx}'],
      excludeNodeModules: true,
      cleanOnRerun: true,
      all: false,
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      provider: 'v8',
    },
  },
})
