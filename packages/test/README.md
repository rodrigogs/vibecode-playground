# @repo/test

Shared Vitest configuration for the monorepo.

## Usage

```javascript
// vitest.config.mjs
import { defineConfig } from '@repo/test/vitest.config.mjs'

export default defineConfig()
```

## Features

- **Dual test projects**: Unit tests (`*.spec.ts`) and integration tests (`*.test.ts`)
- **Coverage reporting**: HTML, JSON, and text formats
- **ESM support**: Configuration uses `.mjs` files
- **Vitest UI**: Interactive test debugging

## Configuration

The `defineConfig` function provides:

### Test Projects
- **Unit tests**: `**/src/**/*.spec.ts` (fast, isolated tests)
- **Integration tests**: `**/src/**/*.test.ts` (component interaction tests)

### Coverage
- **Include**: `**/src/**/*.ts` source files
- **Exclude**: node_modules, dist, build artifacts
- **Reporters**: text, JSON, HTML
- **Output**: `./coverage` directory

## Dependencies

- `vitest` - Test runner
- `@vitest/coverage-v8` - Coverage reporting  
- `@vitest/ui` - Interactive test interface
- `@faker-js/faker` - Test data generation
