import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { delay } from './delay.js'

describe('delay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should resolve after specified milliseconds', async () => {
    const ms = 1000
    const promise = delay(ms)

    // Fast-forward time by the specified ms
    vi.advanceTimersByTime(ms)

    await expect(promise).resolves.toBeUndefined()
  })

  it('should not resolve before the specified time', async () => {
    const ms = 1000
    const promise = delay(ms)

    // Fast-forward time by half the specified ms
    vi.advanceTimersByTime(ms / 2)

    // Create a flag to check if promise resolved
    let resolved = false
    const checkResolved = async () => {
      await Promise.race([
        promise.then(() => {
          resolved = true
        }),
        Promise.resolve(),
      ])
      return resolved
    }

    // Check if it resolved (it shouldn't have)
    expect(await checkResolved()).toBe(false)

    // Advance the remaining time
    vi.advanceTimersByTime(ms / 2)

    // Now it should resolve
    await promise
    expect(await checkResolved()).toBe(true)
  })
})
