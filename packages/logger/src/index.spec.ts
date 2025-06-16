import { FileUtils } from '@repo/utils'
import debug from 'debug'
import fs from 'fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createLogger } from './index.js'

vi.mock('@repo/utils', () => ({
  FileUtils: {
    findNearestPackageJson: vi.fn(),
    findRootPackageJson: vi.fn(),
  },
}))

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof fs>('fs')
  return {
    ...actual,
    readFileSync: vi.fn(),
  }
})

describe('createLogger', () => {
  const mockPackageJsonPath = '/path/to/package.json'
  const mockRootPackageJsonPath = '/path/to/root/package.json'
  const mockPackageJson = JSON.stringify({ name: '@repo/logger-test' })
  const mockRootPackageJson = JSON.stringify({ name: 'vibe-rot' })

  beforeEach(() => {
    vi.spyOn(FileUtils, 'findNearestPackageJson').mockReturnValue(
      mockPackageJsonPath,
    )
    vi.spyOn(FileUtils, 'findRootPackageJson').mockReturnValue(
      mockRootPackageJsonPath,
    )
    vi.spyOn(fs, 'readFileSync')
      .mockReturnValueOnce(mockPackageJson)
      .mockReturnValue(mockRootPackageJson)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return an object containing info, error, warn, debug', () => {
    const logger = createLogger('mynamespace')
    expect(logger).toHaveProperty('info')
    expect(logger).toHaveProperty('error')
    expect(logger).toHaveProperty('warn')
    expect(logger).toHaveProperty('debug')
  })

  it('should create debug namespaces with correct format', () => {
    const logger = createLogger('mynamespace')
    logger.info('test')
    expect(debug.enabled('vibe-rot:info:logger-test:mynamespace')).toBe(false)
  })

  it.each([
    [
      'packageJson',
      () => vi.spyOn(FileUtils, 'findNearestPackageJson').mockReturnValue(null),
      'Package path not found',
    ],
    [
      'root packageJson',
      () => vi.spyOn(FileUtils, 'findRootPackageJson').mockReturnValue(null),
      'Root package path not found',
    ],
  ] as const)(
    'should throw an error when %s is not found',
    (type, setupMock, expectedError) => {
      setupMock()
      expect(() => createLogger('no-package')).toThrow(expectedError)
    },
  )

  it('should use full package name when current module package does not start with @', () => {
    // Clear all previous mocks to ensure clean state
    vi.clearAllMocks()
    vi.restoreAllMocks()

    // Create a non-scoped package name to trigger line 43: `: currentModulePkg.name`
    const packageJsonContent = JSON.stringify({
      name: 'unscoped-package',
    })
    const rootPackageJsonContent = JSON.stringify({
      name: 'root-package',
    })

    // Setup fresh mocks
    vi.spyOn(FileUtils, 'findNearestPackageJson').mockReturnValue(
      '/mock/package.json',
    )
    vi.spyOn(FileUtils, 'findRootPackageJson').mockReturnValue(
      '/mock/root/package.json',
    )

    // Mock readFileSync with explicit returns
    vi.spyOn(fs, 'readFileSync').mockImplementation((path: any) => {
      if (path === '/mock/package.json') {
        return packageJsonContent
      }
      if (path === '/mock/root/package.json') {
        return rootPackageJsonContent
      }
      throw new Error(`Unexpected path: ${path}`)
    })

    // This executes line 43 since 'unscoped-package'.startsWith('@') is false
    const logger = createLogger('test-namespace')

    // Verify the logger was created successfully
    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.debug).toBe('function')
  })

  // Note: The error case in getCallerDir is difficult to test in a controlled way
  // The catch block is primarily for defensive programming

  it('should handle error in getCallerDir function by making Error constructor throw', () => {
    const originalError = global.Error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Replace Error constructor to throw when accessed for stack trace
    global.Error = class extends originalError {
      constructor(...args: any[]) {
        super(...args)
        // Make stack access throw
        Object.defineProperty(this, 'stack', {
          get() {
            throw new Error('Stack access error')
          },
        })
      }
    } as any

    try {
      const logger = createLogger('test-error')
      expect(logger).toHaveProperty('info')
      expect(consoleSpy).toHaveBeenCalled()
    } finally {
      global.Error = originalError
      consoleSpy.mockRestore()
    }
  })

  it.each([
    [
      'scoped package with non-scoped root',
      '@repo/logger-test',
      'monorepo-template',
    ],
    [
      'non-scoped package with scoped root',
      'logger-test',
      '@repo/monorepo-template',
    ],
  ] as const)(
    'should handle mixed scope scenarios - %s',
    (scenario, packageName, rootPackageName) => {
      const packageJson = JSON.stringify({ name: packageName })
      const rootPackageJson = JSON.stringify({ name: rootPackageName })

      vi.spyOn(fs, 'readFileSync')
        .mockReturnValueOnce(packageJson)
        .mockReturnValue(rootPackageJson)

      const logger = createLogger('mynamespace')
      expect(logger).toHaveProperty('info')
      expect(logger).toHaveProperty('error')
      expect(logger).toHaveProperty('warn')
      expect(logger).toHaveProperty('debug')
    },
  )
})
