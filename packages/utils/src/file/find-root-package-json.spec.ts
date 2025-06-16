import { beforeEach, describe, expect, it, vi } from 'vitest'

import { findNearestPackageJson } from './find-nearest-package-json.js'
import { findRootPackageJson } from './find-root-package-json.js'

// Mock the findNearestPackageJson dependency
vi.mock('./find-nearest-package-json.js', () => ({
  findNearestPackageJson: vi.fn(),
}))

describe('findRootPackageJson', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it.each([
    ['null when no package.json is found', null, null],
    [
      'the only package.json when only one is found',
      '/root/package.json',
      '/root/package.json',
    ],
  ] as const)('should return %s', (description, mockReturn, expectedResult) => {
    if (mockReturn) {
      vi.mocked(findNearestPackageJson)
        .mockReturnValueOnce(mockReturn)
        .mockReturnValueOnce(null)
    } else {
      vi.mocked(findNearestPackageJson).mockReturnValue(null)
    }

    const result = findRootPackageJson('/some/path')

    expect(findNearestPackageJson).toHaveBeenCalledWith('/some/path')
    expect(result).toBe(expectedResult)
  })

  it('should traverse up and find the root package.json in nested structure', () => {
    const nestedPackageJson = '/project/packages/utils/package.json'
    const rootPackageJson = '/project/package.json'

    vi.mocked(findNearestPackageJson)
      .mockReturnValueOnce(nestedPackageJson)
      .mockReturnValueOnce(rootPackageJson)
      .mockReturnValueOnce(null)

    const result = findRootPackageJson('/project/packages/utils/src')

    expect(result).toBe(rootPackageJson)
    expect(findNearestPackageJson).toHaveBeenCalledTimes(2)
  })

  it('should handle multiple nested levels', () => {
    const deepPackageJson = '/project/packages/sub/nested/package.json'
    const midPackageJson = '/project/packages/sub/package.json'
    const rootPackageJson = '/project/package.json'

    vi.mocked(findNearestPackageJson)
      .mockReturnValueOnce(deepPackageJson)
      .mockReturnValueOnce(midPackageJson)
      .mockReturnValueOnce(rootPackageJson)
      .mockReturnValueOnce(null)

    const result = findRootPackageJson('/project/packages/sub/nested/src')

    expect(result).toBe(rootPackageJson)
    expect(findNearestPackageJson).toHaveBeenCalledTimes(3)
  })

  it('should handle filesystem root correctly', () => {
    const rootPackageJson = '/package.json'

    vi.mocked(findNearestPackageJson).mockReturnValueOnce(rootPackageJson)

    const result = findRootPackageJson('/some/path')

    expect(result).toBe(rootPackageJson)
    expect(findNearestPackageJson).toHaveBeenCalledTimes(1)
  })
})
