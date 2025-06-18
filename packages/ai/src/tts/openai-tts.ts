import OpenAI from 'openai'
import type { Readable } from 'stream'

import type {
  OpenAITTSModels,
  OpenAITTSOutputFormats,
  OpenAITTSVoices,
  TTSOptions,
} from '../types.js'

/**
 * OpenAI TTS models
 * Includes the new gpt-4o-mini-tts model for improved performance
 */
export type TTSModel = OpenAITTSModels

/**
 * Available OpenAI TTS voices (Updated with latest voices from OpenAI API)
 * Includes the requested "ash" voice and other new voices
 */
export type TTSVoice = OpenAITTSVoices

/**
 * Supported audio formats
 */
export type AudioFormat = OpenAITTSOutputFormats

/**
 * TTS service configuration
 */
export interface TTSConfig {
  apiKey?: string
  baseURL?: string
  defaultModel?: TTSModel
  defaultVoice?: TTSVoice
  defaultFormat?: AudioFormat
}

/**
 * TTS generation result
 */
export interface TTSResult {
  audio: Buffer
  format: AudioFormat
  model: TTSModel
  voice: TTSVoice
  text: string
  duration?: number
  size: number
}

/**
 * OpenAI Text-to-Speech service
 *
 * @example
 * ```typescript
 * const tts = new OpenAITTS({
 *   apiKey: process.env.OPENAI_API_KEY,
 *   defaultVoice: 'ash' // The requested voice
 * })
 *
 * const audio = await tts.generateSpeech("Hello, I'm your AI assistant!", {
 *   model: 'gpt-4o-mini-tts', // New improved model
 *   voice: 'ash',
 *   instructions: 'Speak in a friendly, engaging tone'
 * })
 * ```
 */
export class OpenAITTS {
  private client: OpenAI
  private config: Required<TTSConfig>

  constructor(config: TTSConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || '',
      baseURL: config.baseURL || 'https://api.openai.com/v1',
      defaultModel: config.defaultModel || 'gpt-4o-mini-tts', // Use the new model as default
      defaultVoice: config.defaultVoice || 'ash', // Use the requested "ash" voice
      defaultFormat: config.defaultFormat || 'mp3',
    }

    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required for TTS service')
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
    })
  }

  /**
   * Generate speech audio from text
   */
  async generateSpeech(
    text: string,
    options: TTSOptions = {},
  ): Promise<TTSResult> {
    const startTime = Date.now()

    const model = options.model || this.config.defaultModel
    const voice = options.voice || this.config.defaultVoice
    const responseFormat = options.response_format || this.config.defaultFormat
    const speed = Math.max(0.25, Math.min(4.0, options.speed || 1.0))

    try {
      console.log(
        `Generating TTS: model=${model}, voice=${voice}, format=${responseFormat}`,
      )

      // Build request parameters based on model capabilities
      const requestParams: {
        model: TTSModel
        voice: TTSVoice
        input: string
        response_format: AudioFormat
        instructions?: string
        speed?: number
      } = {
        model,
        voice,
        input: text,
        response_format: responseFormat,
      }

      // Add instructions only for gpt-4o-mini-tts
      if (model === 'gpt-4o-mini-tts' && options.instructions) {
        requestParams.instructions = options.instructions
      }

      // Add speed only for non-gpt-4o-mini-tts models
      if (model !== 'gpt-4o-mini-tts') {
        requestParams.speed = speed
      }

      const response = await this.client.audio.speech.create(requestParams)

      // Convert response to buffer
      const arrayBuffer = await response.arrayBuffer()
      const audio = Buffer.from(arrayBuffer)

      const duration = Date.now() - startTime

      console.log(
        `TTS generated successfully: ${audio.length} bytes in ${duration}ms`,
      )

      return {
        audio,
        format: responseFormat,
        model,
        voice,
        text,
        duration,
        size: audio.length,
      }
    } catch (error) {
      console.error('TTS generation failed:', error)
      throw new Error(
        `Failed to generate speech: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Generate speech and return as readable stream
   * Useful for streaming audio responses
   */
  async generateSpeechStream(
    text: string,
    options: TTSOptions = {},
  ): Promise<Readable> {
    const model = options.model || this.config.defaultModel
    const voice = options.voice || this.config.defaultVoice
    const responseFormat = options.response_format || this.config.defaultFormat
    const speed = Math.max(0.25, Math.min(4.0, options.speed || 1.0))

    try {
      console.log(
        `Generating TTS stream: model=${model}, voice=${voice}, format=${responseFormat}`,
      )

      // Build request parameters based on model capabilities
      const requestParams: {
        model: TTSModel
        voice: TTSVoice
        input: string
        response_format: AudioFormat
        instructions?: string
        speed?: number
      } = {
        model,
        voice,
        input: text,
        response_format: responseFormat,
      }

      // Add instructions only for gpt-4o-mini-tts
      if (model === 'gpt-4o-mini-tts' && options.instructions) {
        requestParams.instructions = options.instructions
      }

      // Add speed only for non-gpt-4o-mini-tts models
      if (model !== 'gpt-4o-mini-tts') {
        requestParams.speed = speed
      }

      const response = await this.client.audio.speech.create(requestParams)

      return response.body as unknown as Readable
    } catch (error) {
      console.error('TTS stream generation failed:', error)
      throw new Error(
        `Failed to generate speech stream: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): TTSVoice[] {
    return [
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
  }

  /**
   * Get available models
   */
  getAvailableModels(): TTSModel[] {
    return ['tts-1', 'tts-1-hd', 'gpt-4o-mini-tts']
  }

  /**
   * Get supported audio formats
   */
  getSupportedFormats(): AudioFormat[] {
    return ['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm']
  }

  /**
   * Validate TTS options
   */
  validateOptions(options: TTSOptions): void {
    if (options.model && !this.getAvailableModels().includes(options.model)) {
      throw new Error(
        `Invalid model: ${options.model}. Available: ${this.getAvailableModels().join(', ')}`,
      )
    }

    if (options.voice && !this.getAvailableVoices().includes(options.voice)) {
      throw new Error(
        `Invalid voice: ${options.voice}. Available: ${this.getAvailableVoices().join(', ')}`,
      )
    }

    if (
      options.response_format &&
      !this.getSupportedFormats().includes(options.response_format)
    ) {
      throw new Error(
        `Invalid format: ${options.response_format}. Available: ${this.getSupportedFormats().join(', ')}`,
      )
    }

    if (options.speed && (options.speed < 0.25 || options.speed > 4.0)) {
      throw new Error('Speed must be between 0.25 and 4.0')
    }
  }

  /**
   * Estimate audio duration (rough estimate based on text length)
   * Actual duration depends on voice speed and content
   */
  estimateAudioDuration(text: string, speed: number = 1.0): number {
    // Rough estimate: ~150 words per minute at normal speed
    const wordsPerMinute = 150 * speed
    const wordCount = text.split(/\s+/).length
    return Math.ceil((wordCount / wordsPerMinute) * 60 * 1000) // milliseconds
  }
}

/**
 * Create a TTS service instance with default configuration
 */
export function createTTSService(config?: TTSConfig): OpenAITTS {
  return new OpenAITTS(config)
}

/**
 * Quick TTS generation function
 * For simple use cases where you just need audio from text
 */
export async function generateSpeech(
  text: string,
  options: TTSOptions & { apiKey?: string } = {},
): Promise<TTSResult> {
  const { apiKey, ...ttsOptions } = options
  const tts = new OpenAITTS({ apiKey })
  return tts.generateSpeech(text, ttsOptions)
}
