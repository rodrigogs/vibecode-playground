# @repo/typescript-config

Shared TypeScript configurations for consistent compilation settings.

## Configurations

```json
// Base configuration
{
  "extends": "@repo/typescript-config/tsconfig.base.json"
}

// ESM build
{
  "extends": "@repo/typescript-config/tsconfig.esm.json"
}

// CommonJS build  
{
  "extends": "@repo/typescript-config/tsconfig.cjs.json"
}
```

## Settings

- **Target**: ES2018 with ES2022 libraries
- **Module**: ESNext with Node resolution
- **Strict mode**: Enabled with `noUncheckedIndexedAccess`
- **Output**: Declaration files (.d.ts) with source maps
- **Base URL**: Points to `src/` directory

## Build Targets

- **ESM**: ES modules for modern environments
- **CJS**: CommonJS for Node.js compatibility
- **Declarations**: TypeScript definition files for both targets

This package is part of the monorepo and is automatically available to other packages. For external use:

```bash
npm install @repo/typescript-config --save-dev
```

## 🔧 Available Configurations

### Base Configuration (`tsconfig.base.json`)

The foundation configuration that all packages should extend:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "incremental": false,
    "isolatedModules": true,
    "lib": ["es2022", "DOM", "DOM.Iterable"],
    "moduleDetection": "force",
    "noUncheckedIndexedAccess": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "target": "es2018",
    "moduleResolution": "node",
    "baseUrl": "${configDir}/src",
    "module": "esnext",
    "allowJs": true
  }
}
```

### ESM Configuration (`tsconfig.esm.json`)

Specialized configuration for ES modules:

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "outDir": "${configDir}/dist/esm",
    "module": "esnext"
  }
}
```

### CJS Configuration (`tsconfig.cjs.json`)

Specialized configuration for CommonJS:

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "outDir": "${configDir}/dist/cjs",
    "module": "commonjs"
  }
}
```

## 🏗️ Configuration Details

### Core Compiler Options

| Option | Value | Purpose |
|--------|-------|---------|
| `strict` | `true` | Enable all strict type checking options |
| `target` | `es2018` | Compile to ES2018 for broad compatibility |
| `lib` | `["es2022", "DOM", "DOM.Iterable"]` | Include modern JS and DOM APIs |
| `moduleResolution` | `node` | Use Node.js module resolution |
| `esModuleInterop` | `true` | Better CommonJS/ESM interoperability |
| `allowJs` | `true` | Allow JavaScript files in TypeScript projects |

### Type Safety Options

| Option | Value | Purpose |
|--------|-------|---------|
| `noUncheckedIndexedAccess` | `true` | Prevent unsafe array/object access |
| `isolatedModules` | `true` | Ensure each file can be transpiled independently |
| `moduleDetection` | `force` | Always treat files as modules |
| `skipLibCheck` | `true` | Skip type checking of declaration files |

### Output Options

| Option | Value | Purpose |
|--------|-------|---------|
| `declaration` | `true` | Generate .d.ts declaration files |
| `declarationMap` | `true` | Generate source maps for declarations |
| `incremental` | `false` | Disable incremental compilation for clean builds |
| `resolveJsonModule` | `true` | Allow importing JSON files |

## 🎯 Usage Examples

### Basic Package Configuration

```json
// packages/my-package/tsconfig.json
{
  "extends": "@repo/typescript-config/tsconfig.base.json",
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Dual Build Setup

```json
// packages/my-package/tsconfig.esm.json
{
  "extends": "@repo/typescript-config/tsconfig.esm.json",
  "compilerOptions": {
    "outDir": "dist/esm"
  }
}
```

```json
// packages/my-package/tsconfig.cjs.json
{
  "extends": "@repo/typescript-config/tsconfig.cjs.json",
  "compilerOptions": {
    "outDir": "dist/cjs"
  }
}
```

### Package.json Build Scripts

```json
{
  "scripts": {
    "build:esm": "tsc --project tsconfig.esm.json",
    "build:cjs": "tsc --project tsconfig.cjs.json",
    "build": "npm run build:esm && npm run build:cjs"
  }
}
```

### Application-Specific Configuration

```json
// apps/my-app/tsconfig.json
{
  "extends": "@repo/typescript-config/tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,  // Don't emit for apps using bundlers
    "jsx": "react-jsx",
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"],
      "@/components/*": ["components/*"]
    }
  },
  "include": ["src/**/*", "types/**/*"],
  "exclude": ["node_modules", "build"]
}
```

## 🔧 Customization

### Path Mapping

```json
{
  "extends": "@repo/typescript-config/tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/utils/*": ["utils/*"],
      "@/components/*": ["components/*"],
      "@/types/*": ["types/*"]
    }
  }
}
```

### Strict Options Override

```json
{
  "extends": "@repo/typescript-config/tsconfig.base.json",
  "compilerOptions": {
    // Relax some strict options for legacy code
    "noImplicitAny": false,
    "strictNullChecks": false
  }
}
```

### Different Target Environment

```json
{
  "extends": "@repo/typescript-config/tsconfig.base.json",
  "compilerOptions": {
    "target": "es2022",  // For modern environments
    "lib": ["es2022", "DOM"]
  }
}
```

## 🧪 Validation and Testing

### Type Checking

```bash
# Check types without emitting files
npx tsc --noEmit

# Check types for specific configuration
npx tsc --project tsconfig.esm.json --noEmit

# Watch mode for development
npx tsc --watch --noEmit
```

### Build Validation

```bash
# Build ESM
npx tsc --project tsconfig.esm.json

# Build CJS
npx tsc --project tsconfig.cjs.json

# Verify output structure
ls -la dist/esm/
ls -la dist/cjs/
```

### Configuration Validation

```bash
# Show effective configuration
npx tsc --showConfig

# Show effective configuration for specific project
npx tsc --project tsconfig.esm.json --showConfig
```

## 📊 Build Output Structure

With the shared configurations, packages will have consistent output:

```
packages/my-package/
├── src/
│   ├── index.ts
│   └── utils.ts
└── dist/
    ├── esm/
    │   ├── index.js
    │   ├── index.d.ts
    │   ├── utils.js
    │   └── utils.d.ts
    └── cjs/
        ├── index.js
        ├── index.d.ts
        ├── utils.js
        └── utils.d.ts
```

## 🎨 IDE Integration

### VS Code Settings

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.preferences.includePackageJsonAutoImports": "auto"
}
```

### IntelliSense Configuration

The shared configurations enable:
- **Auto-imports**: Automatic import suggestions
- **Path completion**: IntelliSense for path mappings
- **Type checking**: Real-time error detection
- **Refactoring**: Safe rename and move operations

## 🔍 Module Resolution

The configurations use Node.js module resolution with these priorities:

1. **Relative imports**: `./module`, `../utils`
2. **Absolute imports**: From `baseUrl` (src directory)
3. **Node modules**: `node_modules` packages
4. **Monorepo packages**: `@repo/*` packages

```typescript
// All these imports work with the base configuration
import { utils } from './utils'           // Relative
import { Component } from 'components'     // From baseUrl
import { lodash } from 'lodash'           // Node modules
import { createLogger } from '@repo/logger' // Monorepo package
```

## 📈 Performance Considerations

### Compilation Speed
- **Incremental builds**: Disabled for clean production builds
- **Skip lib check**: Faster compilation by skipping type checking of .d.ts files
- **Isolated modules**: Each file can be compiled independently

### Development Experience
- **Fast refresh**: Quick recompilation during development
- **Watch mode**: Efficient file watching and recompilation
- **Source maps**: Better debugging experience

### Build Optimization
```bash
# Use project references for faster builds
npx tsc --build

# Parallel compilation with npm scripts
npm run build:esm & npm run build:cjs & wait
```

## 🛡️ Type Safety Features

### Strict Mode Benefits
- **No implicit any**: All types must be explicitly defined
- **Strict null checks**: Prevents null/undefined errors
- **Strict function types**: Ensures parameter compatibility
- **No implicit returns**: All code paths must return values

### Additional Safety
- **No unchecked indexed access**: Prevents unsafe array/object access
- **Unused locals**: Warns about unused variables
- **Unused parameters**: Warns about unused function parameters

## 🔮 Future Enhancements

- **Project references**: For faster builds in large monorepos
- **Composite projects**: Better incremental compilation
- **Custom transformers**: Advanced code transformations
- **Multiple target configs**: Different builds for different environments
- **Performance monitoring**: Build time optimization
- **Custom path mapping**: More flexible path resolution

## 🤝 Contributing

When contributing to TypeScript configurations:

1. **Test across packages**: Ensure changes work for all package types
2. **Backward compatibility**: Don't break existing builds
3. **Performance impact**: Consider compilation speed effects
4. **Documentation**: Update examples and explanations
5. **IDE support**: Ensure good developer experience

### Adding New Configurations

```json
// New specialized configuration
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    // Specialized options
    "target": "es2020",
    "module": "system"
  }
}
```

### Testing Configuration Changes

```bash
# Test with a sample package
cd packages/test-package
npx tsc --project tsconfig.json --noEmit

# Verify output for both targets
npm run build:esm
npm run build:cjs

# Check declaration files
npx tsc --project tsconfig.esm.json --emitDeclarationOnly
```

This shared TypeScript configuration ensures consistent compilation behavior across the monorepo while providing the flexibility needed for different package types and build targets.
