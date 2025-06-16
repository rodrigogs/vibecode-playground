import {
  defineConfig as defineViteConfig,
  defineProject,
  mergeConfig,
} from 'vitest/config'

const excludedPaths = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.turbo/**',
  '**/.next/**',
  '**/.history/**',
]

/**
 * The vitest configuration should be a .mjs file because we use ESM in our config file.
 * But vitest VSCode extension doesn't support ESM when package.json is not set to type: module.
 * Our project is a TypeScript project, and we can't use type: module in package.json because it breaks the TypeScript compiler.
 * By using vitest.config.mjs as the configuration file and --input-type=module in VSCode's vitest settings, we can use vitest with ESM, TypeScript, and VSCode.
 *
 * @param {import('vitest/node').UserConfig} [config={}]
 * @returns {import('vitest/node').UserWorkspaceConfig}
 */
const createBaseConfig = (config = {}) =>
  mergeConfig(
    config,
    defineViteConfig({
      test: {
        exclude: excludedPaths,
        coverage: {
          exclude: excludedPaths,
          include: ['**/src/**/*.ts'], // Only include source TypeScript files
          excludeNodeModules: true,
          cleanOnRerun: true, // Clean the coverage directory before each run
          all: true, // Include all files, not just the ones touched by tests
          reporter: ['text', 'json', 'html'],
          reportsDirectory: './coverage',
        },
      },
    }),
  )

export const defineConfig = (config) =>
  mergeConfig(
    createBaseConfig(config),
    defineViteConfig({
      test: {
        projects: [
          defineProject({
            test: {
              extends: true,
              name: 'unit',
              include: ['**/src/**/*.spec.ts'],
            },
          }),
          defineProject({
            test: {
              extends: true,
              name: 'integration',
              include: ['**/src/**/*.test.ts'],
            },
          }),
        ],
      },
    }),
  )

export default defineConfig()
