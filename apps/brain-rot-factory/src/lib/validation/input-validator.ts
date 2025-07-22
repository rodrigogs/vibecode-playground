/**
 * Comprehensive Input Validation and Sanitization System
 *
 * This module provides secure input validation and sanitization to prevent:
 * - XSS attacks
 * - SQL injection
 * - Command injection
 * - NoSQL injection
 * - JSON injection
 * - Path traversal
 * - DoS attacks via oversized inputs
 * - Malicious content injection
 */

import DOMPurify from 'isomorphic-dompurify'
import { z } from 'zod'

// Configuration for input validation
export const VALIDATION_CONFIG = {
  // Text input limits
  MAX_MESSAGE_LENGTH: 2000,
  MAX_THREAD_ID_LENGTH: 100,
  MAX_FINGERPRINT_LENGTH: 5000,
  MAX_USERNAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 254,
  MAX_URL_LENGTH: 2048,
  MAX_FILENAME_LENGTH: 255,

  // Content limits
  MAX_JSON_SIZE: 10 * 1024, // 10KB
  MAX_ARRAY_LENGTH: 100,
  MAX_OBJECT_KEYS: 50,
  MAX_NESTING_DEPTH: 10,

  // Character restrictions
  ALLOWED_CHARACTERS: {
    ALPHANUMERIC: /^[a-zA-Z0-9]*$/,
    ALPHANUMERIC_SPACES: /^[a-zA-Z0-9\s]*$/,
    ALPHANUMERIC_BASIC_PUNCTUATION: /^[a-zA-Z0-9\s.,!?'-]*$/,
    SAFE_TEXT: /^[a-zA-Z0-9\s.,!?'"-:;()[\]{}@#$%^&*+=/_<>|~`]*$/,
    THREAD_ID: /^[a-zA-Z0-9_-]*$/,
    FINGERPRINT: /^[a-zA-Z0-9+/={}":,[\].-]*$/,
  },

  // Blocked patterns (common injection patterns)
  BLOCKED_PATTERNS: [
    // SQL injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /('|(\\x27)|(\\x2D\\x2D)|(\\x23)|(\\x3B)|(\\x0A)|(\\x0D)|(\\x00)|(\\x1A))/i,

    // NoSQL injection patterns
    /(\$where|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$regex|\$exists)/i,

    // Command injection patterns
    /(;|\||&|`|\$\(|\${|<|>|\\x)/i,

    // Path traversal patterns
    /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\\)/i,

    // XSS patterns
    /(<script|<\/script|javascript:|data:|vbscript:|onload=|onerror=|onclick=)/i,

    // Additional dangerous patterns
    /(eval\(|exec\(|system\(|shell_exec\(|passthru\()/i,
    /(file_get_contents\(|file_put_contents\(|fopen\(|fwrite\()/i,
  ],

  // Allowed MIME types for file uploads
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'text/plain',
    'application/json',
  ],
}

// Validation error class
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string,
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Input sanitization functions
export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return ''

    // Use DOMPurify to sanitize HTML
    const sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    })

    return sanitized.trim()
  }

  /**
   * Sanitize text input for safe storage and display
   */
  static sanitizeText(input: string): string {
    if (typeof input !== 'string') return ''

    // Remove null bytes and control characters
    // eslint-disable-next-line no-control-regex
    let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

    // Normalize unicode
    sanitized = sanitized.normalize('NFC')

    // Sanitize HTML
    sanitized = this.sanitizeHtml(sanitized)

    // Trim whitespace
    sanitized = sanitized.trim()

    return sanitized
  }

  /**
   * Sanitize JSON input
   */
  static sanitizeJson(input: unknown): unknown {
    if (typeof input === 'string') {
      return this.sanitizeText(input)
    }

    if (Array.isArray(input)) {
      return input
        .map((item) => this.sanitizeJson(item))
        .slice(0, VALIDATION_CONFIG.MAX_ARRAY_LENGTH)
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: Record<string, unknown> = {}
      const keys = Object.keys(input).slice(
        0,
        VALIDATION_CONFIG.MAX_OBJECT_KEYS,
      )

      for (const key of keys) {
        const sanitizedKey = this.sanitizeText(key)
        if (sanitizedKey) {
          sanitized[sanitizedKey] = this.sanitizeJson(
            (input as Record<string, unknown>)[key],
          )
        }
      }

      return sanitized
    }

    return input
  }

  /**
   * Sanitize URL input
   */
  static sanitizeUrl(input: string): string {
    if (typeof input !== 'string') return ''

    try {
      const url = new URL(input)

      // Only allow safe protocols
      const allowedProtocols = ['http:', 'https:', 'ftp:', 'ftps:']
      if (!allowedProtocols.includes(url.protocol)) {
        throw new ValidationError('Invalid URL protocol')
      }

      return url.toString()
    } catch {
      throw new ValidationError('Invalid URL format')
    }
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(input: string): string {
    if (typeof input !== 'string') return ''

    // Remove dangerous characters
    // eslint-disable-next-line no-control-regex
    let sanitized = input.replace(/[<>:"/\\|?*\x00-\x1f]/g, '')

    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '')

    // Prevent reserved names on Windows
    const reservedNames = [
      'CON',
      'PRN',
      'AUX',
      'NUL',
      'COM1',
      'COM2',
      'COM3',
      'COM4',
      'COM5',
      'COM6',
      'COM7',
      'COM8',
      'COM9',
      'LPT1',
      'LPT2',
      'LPT3',
      'LPT4',
      'LPT5',
      'LPT6',
      'LPT7',
      'LPT8',
      'LPT9',
    ]
    if (reservedNames.includes(sanitized.toUpperCase())) {
      sanitized = `_${sanitized}`
    }

    return sanitized.slice(0, VALIDATION_CONFIG.MAX_FILENAME_LENGTH)
  }
}

// Input validation functions
export class InputValidator {
  /**
   * Validate message content
   */
  static validateMessage(input: unknown): string {
    if (typeof input !== 'string') {
      throw new ValidationError(
        'Message must be a string',
        'message',
        'INVALID_TYPE',
      )
    }

    if (input.length === 0) {
      throw new ValidationError(
        'Message cannot be empty',
        'message',
        'REQUIRED',
      )
    }

    if (input.length > VALIDATION_CONFIG.MAX_MESSAGE_LENGTH) {
      throw new ValidationError(
        `Message too long (max ${VALIDATION_CONFIG.MAX_MESSAGE_LENGTH} characters)`,
        'message',
        'MAX_LENGTH',
      )
    }

    // Check for malicious patterns
    this.checkMaliciousPatterns(input, 'message')

    // Sanitize the input
    const sanitized = InputSanitizer.sanitizeText(input)

    if (sanitized.length === 0) {
      throw new ValidationError(
        'Message contains only invalid characters',
        'message',
        'INVALID_CONTENT',
      )
    }

    return sanitized
  }

  /**
   * Validate thread ID
   */
  static validateThreadId(input: unknown): string | undefined {
    if (input === undefined || input === null) {
      return undefined
    }

    if (typeof input !== 'string') {
      throw new ValidationError(
        'Thread ID must be a string',
        'threadId',
        'INVALID_TYPE',
      )
    }

    if (input.length > VALIDATION_CONFIG.MAX_THREAD_ID_LENGTH) {
      throw new ValidationError(
        `Thread ID too long (max ${VALIDATION_CONFIG.MAX_THREAD_ID_LENGTH} characters)`,
        'threadId',
        'MAX_LENGTH',
      )
    }

    if (!VALIDATION_CONFIG.ALLOWED_CHARACTERS.THREAD_ID.test(input)) {
      throw new ValidationError(
        'Thread ID contains invalid characters',
        'threadId',
        'INVALID_CHARACTERS',
      )
    }

    return input
  }

  /**
   * Validate fingerprint data
   */
  static validateFingerprint(input: unknown): string | undefined {
    if (input === undefined || input === null) {
      return undefined
    }

    if (typeof input !== 'string') {
      throw new ValidationError(
        'Fingerprint must be a string',
        'fingerprint',
        'INVALID_TYPE',
      )
    }

    if (input.length > VALIDATION_CONFIG.MAX_FINGERPRINT_LENGTH) {
      throw new ValidationError(
        `Fingerprint too long (max ${VALIDATION_CONFIG.MAX_FINGERPRINT_LENGTH} characters)`,
        'fingerprint',
        'MAX_LENGTH',
      )
    }

    // Try to parse as JSON to ensure it's valid
    try {
      const parsed = JSON.parse(input)
      const sanitized = InputSanitizer.sanitizeJson(parsed)
      return JSON.stringify(sanitized)
    } catch {
      throw new ValidationError(
        'Invalid fingerprint format',
        'fingerprint',
        'INVALID_FORMAT',
      )
    }
  }

  /**
   * Validate email address
   */
  static validateEmail(input: unknown): string {
    if (typeof input !== 'string') {
      throw new ValidationError(
        'Email must be a string',
        'email',
        'INVALID_TYPE',
      )
    }

    if (input.length > VALIDATION_CONFIG.MAX_EMAIL_LENGTH) {
      throw new ValidationError(
        `Email too long (max ${VALIDATION_CONFIG.MAX_EMAIL_LENGTH} characters)`,
        'email',
        'MAX_LENGTH',
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(input)) {
      throw new ValidationError(
        'Invalid email format',
        'email',
        'INVALID_FORMAT',
      )
    }

    return InputSanitizer.sanitizeText(input)
  }

  /**
   * Validate URL
   */
  static validateUrl(input: unknown): string {
    if (typeof input !== 'string') {
      throw new ValidationError('URL must be a string', 'url', 'INVALID_TYPE')
    }

    if (input.length > VALIDATION_CONFIG.MAX_URL_LENGTH) {
      throw new ValidationError(
        `URL too long (max ${VALIDATION_CONFIG.MAX_URL_LENGTH} characters)`,
        'url',
        'MAX_LENGTH',
      )
    }

    return InputSanitizer.sanitizeUrl(input)
  }

  /**
   * Check for malicious patterns in input
   */
  static checkMaliciousPatterns(input: string, fieldName: string): void {
    for (const pattern of VALIDATION_CONFIG.BLOCKED_PATTERNS) {
      if (pattern.test(input)) {
        throw new ValidationError(
          `${fieldName} contains potentially malicious content`,
          fieldName,
          'MALICIOUS_CONTENT',
        )
      }
    }
  }

  /**
   * Validate JSON payload size
   */
  static validateJsonSize(input: string): void {
    if (input.length > VALIDATION_CONFIG.MAX_JSON_SIZE) {
      throw new ValidationError(
        `Payload too large (max ${VALIDATION_CONFIG.MAX_JSON_SIZE} bytes)`,
        'payload',
        'MAX_SIZE',
      )
    }
  }

  /**
   * Validate MIME type
   */
  static validateMimeType(mimeType: string): void {
    if (!VALIDATION_CONFIG.ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new ValidationError(
        `Unsupported file type: ${mimeType}`,
        'mimeType',
        'UNSUPPORTED_TYPE',
      )
    }
  }
}

// Zod schemas for additional validation
export const ZodSchemas = {
  chatRequest: z.object({
    message: z.string().min(1).max(VALIDATION_CONFIG.MAX_MESSAGE_LENGTH),
    character: z.object({
      id: z.string().min(1).max(50),
      name: z.string().min(1).max(100),
      description: z.string().min(1).max(500),
      language: z.string().min(1).max(50),
      voice: z.string().optional(),
      image: z.string().optional(),
      images: z.array(z.string()).optional(),
      background: z.string().min(1).max(8000),
      motifs: z.array(z.string()).optional(),
      bgm: z.string().optional(),
      catchphrases: z.array(z.string()).optional(),
      popularity: z.string().optional(),
      country: z.string().optional(),
      gender: z.string().optional(),
      disabled: z.boolean().optional(),
    }),
    threadId: z
      .string()
      .max(VALIDATION_CONFIG.MAX_THREAD_ID_LENGTH)
      .nullable()
      .optional(), // Optional - server generates if not provided
    fingerprint: z
      .string()
      .max(VALIDATION_CONFIG.MAX_FINGERPRINT_LENGTH)
      .optional(),
  }),

  ttsRequest: z.object({
    character: z
      .object({
        id: z.string().min(1).max(50),
        name: z.string().min(1).max(100),
        voice: z.string().optional(),
        gender: z.enum(['male', 'female']).optional(),
        language: z.string().optional(),
        country: z.string().optional(),
      })
      .optional(),
    voice: z.string().optional(),
    instructions: z.string().max(500).optional(),
    format: z.enum(['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm']).optional(),
    ttsToken: z.string().min(1).max(1000),
  }),

  adTokenRequest: z.object({
    fingerprintData: z
      .string()
      .min(1)
      .max(VALIDATION_CONFIG.MAX_FINGERPRINT_LENGTH),
  }),

  adTokenValidation: z.object({
    adToken: z.string().min(1).max(1000),
    fingerprintData: z
      .string()
      .max(VALIDATION_CONFIG.MAX_FINGERPRINT_LENGTH)
      .optional(),
  }),

  rateLimitReset: z.object({
    type: z.enum(['ip', 'user', 'fingerprint']),
    target: z.string().min(1).max(200),
  }),
}

// Utility function to validate with Zod and custom validation
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
  customValidation?: (data: T) => T,
): T {
  try {
    const parsed = schema.parse(input)
    return customValidation ? customValidation(parsed) : parsed
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      throw new ValidationError(
        `Validation error: ${firstError.message}`,
        firstError.path.join('.'),
        'SCHEMA_VALIDATION',
      )
    }
    throw error
  }
}
