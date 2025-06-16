import fs from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { checkFileExists } from './check-file-exists.js'

// Mock the fs module
vi.mock('node:fs', () => ({
  default: {
    promises: {
      access: vi.fn(),
    },
  },
}))

describe('checkFileExists', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it.each([
    [
      'existing file',
      '/path/to/existing/file',
      () => vi.mocked(fs.promises.access).mockResolvedValueOnce(undefined),
      true,
    ],
    [
      'non-existing file',
      '/path/to/non-existing/file',
      () =>
        vi
          .mocked(fs.promises.access)
          .mockRejectedValueOnce(new Error('File not found')),
      false,
    ],
  ] as const)(
    'should return %s when file %s',
    async (expectedResult, filePath, setupMock, expectedValue) => {
      setupMock()

      const result = await checkFileExists(filePath)

      expect(fs.promises.access).toHaveBeenCalledWith(filePath)
      expect(result).toBe(expectedValue)
    },
  )
})
