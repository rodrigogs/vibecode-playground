import { describe, expect, it } from 'vitest'

import type { TTSOptions } from '../types.js'

describe('TTS Integration', () => {
  it('should have correct type definitions for new TTS features', () => {
    // Test that all new voices are properly typed
    const options: TTSOptions = {
      model: 'gpt-4o-mini-tts',
      voice: 'ash',
      instructions: 'Speak in a friendly, engaging tone',
      response_format: 'mp3',
    }

    expect(options.model).toBe('gpt-4o-mini-tts')
    expect(options.voice).toBe('ash')
    expect(options.instructions).toBe('Speak in a friendly, engaging tone')
    expect(options.response_format).toBe('mp3')
  })

  it('should support all new voices', () => {
    const voices: TTSOptions['voice'][] = [
      'alloy',
      'ash',
      'ballad',
      'coral',
      'echo',
      'fable',
      'onyx',
      'nova',
      'sage',
      'shimmer',
      'verse',
    ]

    // All voices should be valid
    voices.forEach((voice) => {
      expect(voice).toBeDefined()
    })
  })

  it('should support all TTS models', () => {
    const models: TTSOptions['model'][] = [
      'gpt-4o-mini-tts',
      'tts-1',
      'tts-1-hd',
    ]

    models.forEach((model) => {
      expect(model).toBeDefined()
    })
  })

  it('should support all audio formats', () => {
    const formats: TTSOptions['response_format'][] = [
      'mp3',
      'opus',
      'aac',
      'flac',
      'wav',
      'pcm',
    ]

    formats.forEach((format) => {
      expect(format).toBeDefined()
    })
  })

  it('should handle instructions parameter properly', () => {
    // Instructions should be optional and string
    const optionsWithInstructions: TTSOptions = {
      model: 'gpt-4o-mini-tts',
      voice: 'ash',
      instructions: 'Use a warm, professional tone with clear articulation',
    }

    const optionsWithoutInstructions: TTSOptions = {
      model: 'gpt-4o-mini-tts',
      voice: 'ash',
    }

    expect(optionsWithInstructions.instructions).toBeDefined()
    expect(optionsWithoutInstructions.instructions).toBeUndefined()
  })

  it('should handle speed parameter properly', () => {
    // Speed should be optional and number
    const optionsWithSpeed: TTSOptions = {
      model: 'tts-1',
      voice: 'ash',
      speed: 1.25,
    }

    const optionsWithoutSpeed: TTSOptions = {
      model: 'tts-1',
      voice: 'ash',
    }

    expect(optionsWithSpeed.speed).toBe(1.25)
    expect(optionsWithoutSpeed.speed).toBeUndefined()
  })
})
