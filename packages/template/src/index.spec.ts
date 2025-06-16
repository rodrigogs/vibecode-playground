import { describe, expect, it } from 'vitest'

import * as index from './index.js'

describe('unit tests for index', () => {
  it('should have 2 functions', () => {
    expect(Object.keys(index)).toHaveLength(2)
  })

  it.each([
    ['bar', 'bar'],
    ['foo', 'foo'],
  ] as const)('should return %s', (functionName, expectedResult) => {
    expect(index[functionName]()).toBe(expectedResult)
  })
})
