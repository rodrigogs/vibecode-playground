/**
 * Validation Middleware
 *
 * Provides middleware functions for validating and sanitizing request inputs
 * across all API endpoints to ensure security and data integrity.
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type { z } from 'zod'

import {
  InputSanitizer,
  InputValidator,
  validateWithSchema,
  ValidationError,
  ZodSchemas,
} from '@/lib/validation/input-validator'

// Request validation result type
export interface ValidationResult<T = unknown> {
  isValid: boolean
  data?: T
  error?: ValidationError
}

// Validation middleware factory
export function createValidationMiddleware<T>(
  schema: z.ZodSchema<T>,
  customValidation?: (data: T) => T,
) {
  return async (request: NextRequest): Promise<ValidationResult<T>> => {
    try {
      // Parse request body
      const body = await request.json()

      // Validate JSON size
      const bodyString = JSON.stringify(body)
      InputValidator.validateJsonSize(bodyString)

      // Validate with schema and custom validation
      const validatedData = validateWithSchema(schema, body, customValidation)

      return {
        isValid: true,
        data: validatedData,
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          isValid: false,
          error,
        }
      }

      return {
        isValid: false,
        error: new ValidationError(
          'Invalid request format',
          'body',
          'INVALID_FORMAT',
        ),
      }
    }
  }
}

// Specific validation functions for different endpoints
export const validateChatRequest = createValidationMiddleware(
  ZodSchemas.chatRequest,
  (data) => ({
    ...data,
    message: InputValidator.validateMessage(data.message),
    threadId: InputValidator.validateThreadId(data.threadId),
    fingerprint: InputValidator.validateFingerprint(data.fingerprint),
  }),
)

export const validateTTSRequest = createValidationMiddleware(
  ZodSchemas.ttsRequest,
)

export const validateAdTokenRequest = createValidationMiddleware(
  ZodSchemas.adTokenRequest,
  (data) => ({
    ...data,
    fingerprintData:
      InputValidator.validateFingerprint(data.fingerprintData) || '',
  }),
)

export const validateAdTokenValidation = createValidationMiddleware(
  ZodSchemas.adTokenValidation,
  (data) => ({
    ...data,
    fingerprintData: data.fingerprintData
      ? InputValidator.validateFingerprint(data.fingerprintData)
      : undefined,
  }),
)

export const validateRateLimitReset = createValidationMiddleware(
  ZodSchemas.rateLimitReset,
)

// Helper function to create validation error response
export function createValidationErrorResponse(
  error: ValidationError,
): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: error.message,
      field: error.field,
      code: error.code,
    },
    { status: 400 },
  )
}

// Header validation
export function validateHeaders(
  request: NextRequest,
): ValidationResult<Record<string, string>> {
  try {
    const headers: Record<string, string> = {}

    // Validate common headers
    const userAgent = request.headers.get('user-agent')
    if (userAgent) {
      headers['user-agent'] = InputSanitizer.sanitizeText(userAgent)
    }

    const contentType = request.headers.get('content-type')
    if (contentType) {
      headers['content-type'] = InputSanitizer.sanitizeText(contentType)
    }

    const authorization = request.headers.get('authorization')
    if (authorization) {
      headers['authorization'] = InputSanitizer.sanitizeText(authorization)
    }

    return {
      isValid: true,
      data: headers,
    }
  } catch {
    return {
      isValid: false,
      error: new ValidationError(
        'Invalid headers',
        'headers',
        'INVALID_HEADERS',
      ),
    }
  }
}

// Query parameter validation
export function validateQueryParams(
  request: NextRequest,
  allowedParams: string[] = [],
): ValidationResult<Record<string, string>> {
  try {
    const params: Record<string, string> = {}
    const searchParams = request.nextUrl.searchParams

    for (const param of allowedParams) {
      const value = searchParams.get(param)
      if (value) {
        params[param] = InputSanitizer.sanitizeText(value)
      }
    }

    return {
      isValid: true,
      data: params,
    }
  } catch {
    return {
      isValid: false,
      error: new ValidationError(
        'Invalid query parameters',
        'query',
        'INVALID_QUERY',
      ),
    }
  }
}

// File upload validation
export function validateFileUpload(file: File): ValidationResult<File> {
  try {
    // Validate file size (10MB max)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(
        'File too large (max 10MB)',
        'file',
        'FILE_TOO_LARGE',
      )
    }

    // Validate MIME type
    InputValidator.validateMimeType(file.type)

    // Validate filename
    const sanitizedName = InputSanitizer.sanitizeFilename(file.name)
    if (!sanitizedName) {
      throw new ValidationError(
        'Invalid filename',
        'filename',
        'INVALID_FILENAME',
      )
    }

    return {
      isValid: true,
      data: new File([file], sanitizedName, { type: file.type }),
    }
  } catch (error) {
    return {
      isValid: false,
      error:
        error instanceof ValidationError
          ? error
          : new ValidationError('Invalid file', 'file', 'INVALID_FILE'),
    }
  }
}

// IP address validation and sanitization
export function validateIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddress = request.headers.get('x-remote-address')

  let ip = forwarded || realIP || remoteAddress || 'unknown'

  // If forwarded header contains multiple IPs, take the first one
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim()
  }

  // Sanitize IP address
  ip = InputSanitizer.sanitizeText(ip)

  // Basic IP validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/

  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip) && ip !== 'unknown') {
    return 'unknown'
  }

  return ip
}

// Comprehensive request validation
export async function validateRequest<T>(
  request: NextRequest,
  options: {
    schema?: z.ZodSchema<T>
    customValidation?: (data: T) => T
    allowedQueryParams?: string[]
    requireAuth?: boolean
  } = {},
): Promise<{
  isValid: boolean
  data?: {
    body?: T
    headers: Record<string, string>
    query: Record<string, string>
    ip: string
  }
  error?: ValidationError
}> {
  try {
    // Validate headers
    const headerResult = validateHeaders(request)
    if (!headerResult.isValid) {
      return { isValid: false, error: headerResult.error }
    }

    // Validate query parameters
    const queryResult = validateQueryParams(request, options.allowedQueryParams)
    if (!queryResult.isValid) {
      return { isValid: false, error: queryResult.error }
    }

    // Validate IP
    const ip = validateIP(request)

    // Validate body if schema provided
    let bodyData: T | undefined
    if (options.schema) {
      const bodyResult = await createValidationMiddleware(
        options.schema,
        options.customValidation,
      )(request)

      if (!bodyResult.isValid) {
        return { isValid: false, error: bodyResult.error }
      }

      bodyData = bodyResult.data
    }

    return {
      isValid: true,
      data: {
        body: bodyData,
        headers: headerResult.data!,
        query: queryResult.data!,
        ip,
      },
    }
  } catch {
    return {
      isValid: false,
      error: new ValidationError(
        'Request validation failed',
        'request',
        'VALIDATION_FAILED',
      ),
    }
  }
}
