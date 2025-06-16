import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import fileExtensionInImportTs from 'eslint-plugin-file-extension-in-import-ts'
import importPlugin from 'eslint-plugin-import'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import turboPlugin from 'eslint-plugin-turbo'
import tseslint from 'typescript-eslint'

/**
 * A shared ESLint configuration for the repository.
 * This file MUST be imported as a module for VSCode to recognize it.
 * Name your file 'eslint.config.mjs' to use it.
 *
 * @type {import("eslint").Linter.Config}
 */
export const config = [
  {
    files: ['*.js', '*.cjs', '*.mjs', '*.ts', '*.tsx', '*.jsx'],
  },
  js.configs.recommended,
  eslintConfigPrettier, // Disable conflicting ESLint rules
  ...tseslint.configs.recommended,
  ...tseslint.config({
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  }),
  {
    plugins: {
      'import': importPlugin,
      'turbo': turboPlugin,
      'file-extension-in-import-ts': fileExtensionInImportTs,
      'simple-import-sort': simpleImportSort,
      'prettier': eslintPluginPrettier,
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
      'file-extension-in-import-ts/file-extension-in-import-ts': 'error',
      'prettier/prettier': 'error',
    },
  },
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/.vscode/**',
      '**/.history/**',
      '**/eslint.config.{js,cjs,mjs,ts}',
    ],
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx',
      '**/*.mjs',
      '**/*.cjs',
    ],
    rules: {
      'quotes': ['error', 'single', { avoidEscape: true }],
      'comma-dangle': ['error', 'always-multiline'],
      'semi': ['error', 'never'],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/no-default-export': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/vitest.config.mjs'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
]
