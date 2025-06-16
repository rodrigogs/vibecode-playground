import { describe, expect, it } from 'vitest'

import * as index from './index.js'

describe('integration tests for index', () => {
  it('should have 2 functions', () => {
    expect(Object.keys(index)).toHaveLength(2)
  })

  it.each([
    { functionName: 'bar', expected: 'bar' },
    { functionName: 'foo', expected: 'foo' },
  ] as const)('should return $expected', ({ functionName, expected }) => {
    expect(index[functionName]()).toBe(expected)
  })
})
