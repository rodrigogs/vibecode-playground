# @repo/eslint-config

Shared ESLint configuration using flat config format.

## Usage

```javascript
import { config } from '@repo/eslint-config/base'
export default config
```

## Features

- TypeScript support with type-aware rules
- Import sorting and validation
- Prettier integration
- Turbo plugin for monorepo optimization
- Strict mode enabled

## Rules

### TypeScript Rules
- Consistent type imports
- No unused variables
- Recommended TypeScript rules

### Import Rules
- Automatic import sorting
- No duplicate imports
- File extension enforcement for TypeScript imports
- No default exports (except for config files)

### Code Style
- Single quotes
- No semicolons
- Trailing commas in multiline structures
- Prettier formatting

### Monorepo Rules
- Turbo environment variable validation

## File Extensions

Supports: `*.js`, `*.cjs`, `*.mjs`, `*.ts`, `*.tsx`, `*.jsx`

## Overrides

- Test files: Allows `any` type
- Config files: Allows default exports
