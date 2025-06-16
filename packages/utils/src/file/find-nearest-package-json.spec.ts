import { packageUpSync } from 'package-up'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { findNearestPackageJson } from './find-nearest-package-json.js'

// Mock package-up
vi.mock('package-up', () => ({
  packageUpSync: vi.fn(),
}))

describe('findNearestPackageJson', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it.each([
    [
      'found',
      '/path/to/package.json',
      (path: string) => vi.mocked(packageUpSync).mockReturnValueOnce(path),
      '/path/to/package.json',
    ],
    [
      'not found',
      undefined,
      () => vi.mocked(packageUpSync).mockReturnValueOnce(undefined),
      null,
    ],
  ] as const)(
    'should return %s when package.json is %s',
    (status, mockReturn, setupMock, expectedResult) => {
      if (mockReturn) {
        setupMock(mockReturn)
      } else {
        setupMock()
      }

      const result = findNearestPackageJson('/path/to/dir')

      expect(packageUpSync).toHaveBeenCalledWith({ cwd: '/path/to/dir' })
      expect(result).toBe(expectedResult)
    },
  )
})
