import { ChatOpenAI } from '@langchain/openai'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DeepSeekProvider } from './deepseek.js'

// Mock the ChatOpenAI class that's used for DeepSeek
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn(),
}))

describe('DeepSeekProvider', () => {
  let provider: DeepSeekProvider
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Store original env variables and reset mocks
    originalEnv = { ...process.env }
    vi.resetAllMocks()
    provider = new DeepSeekProvider()
  })

  afterEach(() => {
    // Restore original env variables
    process.env = originalEnv
  })

  it.each([
    [
      'valid API key and URL',
      'test-deepseek-key',
      'https://api.deepseek.com',
      'deepseek-chat',
      false,
      {
        apiKey: 'test-deepseek-key',
        configuration: { baseURL: 'https://api.deepseek.com' },
        model: 'deepseek-chat',
      },
    ],
    [
      'missing API key',
      undefined,
      'https://api.deepseek.com',
      'deepseek-chat',
      true,
      null,
    ],
    [
      'valid API key but missing URL',
      'test-deepseek-key',
      undefined,
      'deepseek-chat',
      false,
      {
        apiKey: 'test-deepseek-key',
        configuration: { baseURL: undefined },
        model: 'deepseek-chat',
      },
    ],
  ] as const)(
    'should handle %s scenario',
    (scenario, apiKey, apiUrl, model, shouldThrow, expectedConfig) => {
      // Arrange
      if (apiKey) {
        process.env.DEEPSEEK_API_KEY = apiKey
      } else {
        delete process.env.DEEPSEEK_API_KEY
      }

      if (apiUrl) {
        process.env.DEEPSEEK_API_URL = apiUrl
      } else {
        delete process.env.DEEPSEEK_API_URL
      }

      if (shouldThrow) {
        // Act & Assert
        expect(() => provider.create(model)).toThrow(
          'DEEPSEEK_API_KEY is missing',
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
