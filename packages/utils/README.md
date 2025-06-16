# @repo/utils

File system and time utilities for TypeScript projects. Provides cross-platform path resolution, package.json discovery, and async delays.

## Dual Module Support

This package builds for both ESM and CommonJS environments. Since ESM lacks `__dirname`/`__filename` and CommonJS lacks `import.meta.url`, we use `cross-dirname` to provide consistent path resolution regardless of the module system users choose.

## API

### FileUtils

```typescript
import { FileUtils } from '@repo/utils'

// Find root package.json by traversing up until no more parent package.json files exist
const rootPkg = FileUtils.findRootPackageJson(process.cwd())
// Returns: "/path/to/monorepo/package.json" | null

// Find nearest package.json upward from directory using package-up
const nearestPkg = FileUtils.findNearestPackageJson('./src/components')  
// Returns: "/path/to/package/package.json" | null

// Check if file exists asynchronously
const exists = await FileUtils.checkFileExists('./config.json')
// Returns: boolean

// Cross-platform __dirname equivalent using cross-dirname
const dirname = FileUtils.getDirname(import.meta.url) // ESM
const dirname = FileUtils.getDirname(__filename)      // CJS  
// Returns: "/absolute/path/to/directory"

// Cross-platform __filename equivalent using cross-dirname
const filename = FileUtils.getFilename(import.meta.url) // ESM
const filename = FileUtils.getFilename(__filename)      // CJS
// Returns: "/absolute/path/to/file.js"
```

### TimeUtils

```typescript
import { TimeUtils } from '@repo/utils'

// Promise-based delay using setTimeout
await TimeUtils.delay(1000) // Wait 1 second
await TimeUtils.delay(500)  // Wait 500ms
```

## Usage Examples

### Monorepo Root Discovery

```typescript
// Find the actual root package.json in a monorepo
function findMonorepoRoot() {
  const root = FileUtils.findRootPackageJson(process.cwd())
  if (!root) {
    throw new Error('Not inside a package')
  }
  return path.dirname(root)
}
```

### Cross-Platform Path Resolution

```typescript
// Works in both ESM and CommonJS without modification
const __dirname = FileUtils.getDirname(import.meta.url || __filename)
const __filename = FileUtils.getFilename(import.meta.url || __filename)

// Use for relative paths
const configPath = path.join(__dirname, '../config.json')
```

### Retry with Exponential Backoff

```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await TimeUtils.delay(Math.pow(2, i) * 1000)
    }
  }
  throw new Error('Unreachable')
}
```

### Package Discovery

```typescript
// Find all workspace packages
function getWorkspacePackages() {
  const root = FileUtils.findRootPackageJson(process.cwd())
  if (!root) return []
  
  const rootDir = path.dirname(root)
  const packages = []
  
  for (const dir of ['packages', 'apps']) {
    const dirPath = path.join(rootDir, dir)
    if (fs.existsSync(dirPath)) {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pkgPath = FileUtils.findNearestPackageJson(
            path.join(dirPath, entry.name)
          )
          if (pkgPath) {
            packages.push({
              name: entry.name,
              path: path.join(dirPath, entry.name),
              packageJson: pkgPath
            })
          }
        }
      }
    }
  }
  
  return packages
}
```

### Retry with Exponential Backoff

```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await TimeUtils.delay(Math.pow(2, i) * 1000)
    }
  }
  throw new Error('Unreachable')
}

// Usage
await retryOperation(async () => {
  const response = await fetch('https://api.example.com/data')
  if (!response.ok) throw new Error('API call failed')
  return response.json()
})
```

### Cross-Platform Path Resolution

```typescript
// Works in both ESM and CommonJS
const __dirname = FileUtils.getDirname()
const __filename = FileUtils.getFilename()

// Use for relative paths
const configPath = path.join(__dirname, '../config.json')
const templateDir = path.join(__dirname, '../templates')
```
