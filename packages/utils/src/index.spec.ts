import { describe, expect, it } from 'vitest'

import * as utils from './index.js'

describe('utils index', () => {
  it('should export file, format, and time modules', () => {
    expect(utils).toBeDefined()
    expect(utils).toHaveProperty('FileUtils')
    expect(utils).toHaveProperty('TimeUtils')
    expect(Object.keys(utils).length).toBe(2)
  })
})
