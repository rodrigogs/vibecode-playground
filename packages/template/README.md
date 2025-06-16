# @repo/template

Template package for creating new packages in the monorepo. Contains standard configuration and build setup.

## API

```typescript
export const foo = () => 'foo'
export const bar = () => 'bar'
```

## Usage

Copy this package to create a new one:

```bash
cp -r packages/template packages/my-new-package
# Edit package.json name and details
```

## Configuration

- Dual build targets (ESM/CJS)
- TypeScript configurations
- Test setup with Vitest
- ESLint configuration
- Standard package.json structure

## Structure

```
packages/template/
├── src/index.ts          # Example exports
├── package.json          # Dual build setup
├── tsconfig.*.json       # Build configurations
├── vitest.config.mjs     # Test configuration
└── eslint.config.mjs     # Linting rules
```
