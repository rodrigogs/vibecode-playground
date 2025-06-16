import { ChatOpenAI } from '@langchain/openai'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { OpenAiProvider } from './openai.js'

// Mock the ChatOpenAI class
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn(),
}))

describe('OpenAiProvider', () => {
  let provider: OpenAiProvider
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Store original env variables and reset mocks
    originalEnv = { ...process.env }
    vi.resetAllMocks()
    provider = new OpenAiProvider()
  })

  afterEach(() => {
    // Restore original env variables
    process.env = originalEnv
  })

  it.each([
    [
      'valid API key',
      'test-api-key',
      'gpt-4',
      false,
      {
        apiKey: 'test-api-key',
        model: 'gpt-4',
      },
    ],
    ['missing API key', undefined, 'gpt-4', true, null],
  ] as const)(
    'should handle %s scenario',
    (scenario, apiKey, model, shouldThrow, expectedConfig) => {
      // Arrange
      if (apiKey) {
        process.env.OPENAI_API_KEY = apiKey
      } else {
        delete process.env.OPENAI_API_KEY
      }

      if (shouldThrow) {
        // Act & Assert
        expect(() => provider.create(model)).toThrow(
          'OPENAI_API_KEY is missing',
        )
      } else {
        // Act
        provider.create(model)

        // Assert
        expect(ChatOpenAI).toHaveBeenCalledWith(expectedConfig)
      }
    },
  )
})
