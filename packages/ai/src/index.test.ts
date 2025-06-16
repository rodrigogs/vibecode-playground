import path from 'node:path'

import { ChatOpenAI } from '@langchain/openai'
import { FileUtils } from '@repo/utils'
import { config as dotenvConfig } from 'dotenv'
import { beforeAll, describe, expect, it } from 'vitest'

import { createAgent, createModel } from './index.js'

describe('AI module v2 integration tests', () => {
  beforeAll(() => {
    const rootPath = path.dirname(
      FileUtils.findNearestPackageJson(FileUtils.getDirname()) as string,
    )
    const dotenvPath = path.resolve(rootPath, '.env.test.local')

    dotenvConfig({
      path: dotenvPath,
    })
  })

  it('should have a valid structure', () => {
    expect(createModel).toBeInstanceOf(Function)
    expect(createAgent).toBeInstanceOf(Function)
  })

  it('should have a valid API key', () => {
    expect(process.env.OPENAI_API_KEY).toBeDefined()
  })

  describe('createModel', () => {
    it('should create a ChatOpenAI instance with OpenAI model', () => {
      const model = createModel({
        provider: 'openai',
        model: 'gpt-4',
      })

      expect(model).toBeInstanceOf(ChatOpenAI)
      // We need to check the ChatOpenAI instance directly
      const chatModel = model as ChatOpenAI
      expect(chatModel.model).toBe('gpt-4')
    })

    it('should create a ChatOpenAI instance with Deepseek model', () => {
      // Mock environment variables for Deepseek
      const originalEnv = process.env
      process.env.DEEPSEEK_API_URL = 'https://api.deepseek.com'
      process.env.DEEPSEEK_API_KEY = 'sk-test-key'

      const model = createModel({
        provider: 'deepseek',
        model: 'deepseek-chat',
      })

      expect(model).toBeInstanceOf(ChatOpenAI)
      // We need to check the ChatOpenAI instance directly
      const chatModel = model as ChatOpenAI
      expect(chatModel.modelName).toBe('deepseek-chat')

      // Restore environment
      process.env = originalEnv
    })

    it('should throw error for unsupported provider', () => {
      expect(() => {
        // We need to provide an unknown provider
        const unknownProvider = 'invalid'
        return createModel({
          // @ts-expect-error - Testing invalid provider explicitly for this test
          provider: unknownProvider,
          model: 'gpt-4',
        })
      }).toThrow('Unknown provider: invalid')
    })
  })

  describe('createAgent', () => {
    it('should create a ReactAgent instance', () => {
      const mockOptions = {
        provider: 'openai' as const,
        model: 'gpt-4' as const,
        name: 'TestAgent',
      }

      const result = createAgent(mockOptions)
      expect(result).toBeDefined()
      // Check that the result has the expected structure of a ReactAgent
      expect(result).toHaveProperty('invoke')
    })
  })

  describe('providers', () => {
    it.each([
      [
        'OpenAiProvider',
        'openai',
        'gpt-4',
        'OPENAI_API_KEY',
        'OPENAI_API_KEY is missing',
      ],
      [
        'DeepSeekProvider',
        'deepseek',
        'deepseek-chat',
        'DEEPSEEK_API_KEY',
        'DEEPSEEK_API_KEY is missing',
      ],
    ] as const)(
      'should throw if %s API key is missing',
      (providerName, provider, model, envKey, expectedError) => {
        // Backup existing env
        const originalEnv = process.env
        // Remove API key
        const newEnv = { ...process.env }
        delete newEnv[envKey]
        process.env = newEnv

        try {
          expect(() => createModel({ provider, model })).toThrow(expectedError)
        } finally {
          // Restore env
          process.env = originalEnv
        }
      },
    )

    it('should work without DEEPSEEK_API_URL', () => {
      // Backup existing env
      const originalEnv = process.env
      // Set API key but remove URL
      const newEnv = { ...process.env }
      newEnv.DEEPSEEK_API_KEY = 'test-key'
      delete newEnv.DEEPSEEK_API_URL
      process.env = newEnv

      try {
        const model = createModel({
          provider: 'deepseek',
          model: 'deepseek-chat',
        })
        expect(model).toBeInstanceOf(ChatOpenAI)
      } finally {
        // Restore env
        process.env = originalEnv
      }
    })
  })
})
