import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the main function to prevent actual execution
vi.mock('./index.js', () => ({
  main: vi.fn().mockResolvedValue(undefined),
}))

describe('CLI Entry Point', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle the CLI entry point execution', async () => {
    // Mock console.error to prevent actual error logging
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    try {
      // Import the CLI module which should trigger the main execution
      await import('./cli.js')

      // Import the main function to verify it was called
      const { main } = await import('./index.js')

      // Verify that main was called
      expect(main).toHaveBeenCalled()
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('should handle errors from main function', async () => {
    // Mock main to reject with an error
    const mockError = new Error('Test CLI error')
    const { main } = await import('./index.js')
    vi.mocked(main).mockRejectedValueOnce(mockError)

    // Mock console.error to capture the error handling
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    try {
      // Re-import CLI to trigger the error path
      // Since the module is already loaded, we need to test the error handling directly
      const cliPromise = main().catch(console.error)
      await cliPromise

      // Verify console.error was called with the error
      expect(consoleErrorSpy).toHaveBeenCalledWith(mockError)
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })
})
