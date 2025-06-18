import { describe, expect, it, vi } from 'vitest'

import { createTTSService, OpenAITTS } from './openai-tts.js'

// Mock OpenAI SDK
vi.mock('openai', () => ({
  default: class MockOpenAI {
    audio = {
      speech: {
        create: vi.fn(),
      },
    }
  },
}))

describe('OpenAI TTS', () => {
  describe('OpenAITTS', () => {
    it('should create TTS service with default configuration', () => {
      const tts = new OpenAITTS({
        apiKey: 'test-key',
      })

      expect(tts).toBeDefined()
    })

    it('should use ash voice as default', () => {
      const tts = new OpenAITTS({
        apiKey: 'test-key',
      })

      expect(tts.getAvailableVoices()).toContain('ash')
    })

    it('should include all new voices', () => {
      const tts = new OpenAITTS({
        apiKey: 'test-key',
      })

      const voices = tts.getAvailableVoices()
      expect(voices).toContain('ash')
      expect(voices).toContain('ballad')
      expect(voices).toContain('coral')
      expect(voices).toContain('sage')
      expect(voices).toContain('verse')
    })

    it('should include gpt-4o-mini-tts model', () => {
      const tts = new OpenAITTS({
        apiKey: 'test-key',
      })

      const models = tts.getAvailableModels()
      expect(models).toContain('gpt-4o-mini-tts')
      expect(models).toContain('tts-1')
      expect(models).toContain('tts-1-hd')
    })

    it('should validate TTS options correctly', () => {
      const tts = new OpenAITTS({
        apiKey: 'test-key',
      })

      // Valid options should not throw
      expect(() => {
        tts.validateOptions({
          model: 'gpt-4o-mini-tts',
          voice: 'ash',
          instructions: 'Speak in a friendly tone',
          response_format: 'mp3',
        })
      }).not.toThrow()

      // Invalid voice should throw
      expect(() => {
        tts.validateOptions({
          voice: 'invalid-voice' as any,
        })
      }).toThrow('Invalid voice')

      // Invalid model should throw
      expect(() => {
        tts.validateOptions({
          model: 'invalid-model' as any,
        })
      }).toThrow('Invalid model')

      // Invalid speed should throw
      expect(() => {
        tts.validateOptions({
          speed: 5.0, // Max is 4.0
        })
      }).toThrow('Speed must be between 0.25 and 4.0')
    })

    it('should estimate audio duration', () => {
      const tts = new OpenAITTS({
        apiKey: 'test-key',
      })

      const duration = tts.estimateAudioDuration('Hello world', 1.0)
      expect(duration).toBeGreaterThan(0)
    })
  })

  describe('createTTSService', () => {
    it('should create TTS service instance', () => {
      const tts = createTTSService({
        apiKey: 'test-key',
      })

      expect(tts).toBeInstanceOf(OpenAITTS)
    })
  })
})
