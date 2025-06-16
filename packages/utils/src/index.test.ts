import { tmpdir } from 'os'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'

import { getDirname } from './file/get-dirname.js'
import * as utils from './index.js'

describe('integration tests for utils', () => {
  describe('FileUtils', async () => {
    const currentDirname = getDirname()

    describe('checkFileExists', () => {
      it.each([
        {
          name: 'return true when file exists',
          filePath: `${currentDirname}/index.ts`,
          expected: true,
        },
        {
          name: 'return false when file does not exist',
          filePath: 'idontexist',
          expected: false,
        },
      ] as const)('should $name', async ({ filePath, expected }) => {
        const result = await utils.FileUtils.checkFileExists(filePath)
        expect(result).toBe(expected)
      })
    })

    describe('findNearestPackageJson', () => {
      it.each([
        {
          name: 'find the nearest package.json',
          inputDir: currentDirname,
          expected: resolve(currentDirname, '../package.json'),
        },
        {
          name: 'return null when no package.json is found',
          inputDir: tmpdir(),
          expected: null,
        },
      ] as const)('should $name', ({ inputDir, expected }) => {
        const result = utils.FileUtils.findNearestPackageJson(inputDir)
        expect(result).toBe(expected)
      })
    })
  })

  describe('TimeUtils', () => {
    describe('#delay', () => {
      it('should resolve after 100ms', async () => {
        const start = Date.now()
        await utils.TimeUtils.delay(100)
        const end = Date.now()
        expect(end - start).toBeGreaterThanOrEqual(100)
      })
    })
  })
})
