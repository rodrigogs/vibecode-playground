/**
 * IP Address Extraction Utilities
 *
 * Centralized IP extraction logic that handles various proxy headers
 * and provides consistent IP address resolution across the application.
 */

import { headers } from 'next/headers'
import type { NextRequest } from 'next/server'

/**
 * Configuration for IP extraction priority and validation
 */
export const IP_EXTRACTION_CONFIG = {
  // Header priority order (first found wins)
  HEADER_PRIORITY: [
    'cf-connecting-ip', // Cloudflare (most trusted)
    'x-real-ip', // Nginx/reverse proxy
    'x-forwarded-for', // Standard forwarding header
    'x-remote-address', // Alternative header
    'remote-addr', // Direct connection
  ] as const,

  // Default fallback IP
  DEFAULT_IP: '127.0.0.1',

  // IP validation patterns
  IPV4_PATTERN: /^(\d{1,3}\.){3}\d{1,3}$/,
  IPV6_PATTERN: /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,

  // Private IP ranges (for security context)
  PRIVATE_RANGES: [
    /^10\./, // 10.0.0.0/8
    /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
    /^192\.168\./, // 192.168.0.0/16
    /^127\./, // 127.0.0.0/8 (loopback)
  ] as const,
} as const

/**
 * IP extraction result with metadata
 */
export interface IPExtractionResult {
  ip: string
  source: string
  isValid: boolean
  isPrivate: boolean
  originalValue?: string
}

/**
 * Extract client IP from Next.js server headers
 *
 * @returns Promise<IPExtractionResult> IP extraction result with metadata
 */
export async function getClientIP(): Promise<IPExtractionResult> {
  const headersList = await headers()

  for (const headerName of IP_EXTRACTION_CONFIG.HEADER_PRIORITY) {
    const headerValue = headersList.get(headerName)

    if (headerValue) {
      const result = extractIPFromHeaderValue(headerValue, headerName)
      if (result.isValid) {
        return result
      }
    }
  }

  // Fallback to default IP
  return {
    ip: IP_EXTRACTION_CONFIG.DEFAULT_IP,
    source: 'default',
    isValid: true,
    isPrivate: true,
  }
}

/**
 * Extract client IP from Next.js request object
 *
 * @param request NextRequest object
 * @returns IPExtractionResult IP extraction result with metadata
 */
export function getClientIPFromRequest(
  request: NextRequest,
): IPExtractionResult {
  for (const headerName of IP_EXTRACTION_CONFIG.HEADER_PRIORITY) {
    const headerValue = request.headers.get(headerName)

    if (headerValue) {
      const result = extractIPFromHeaderValue(headerValue, headerName)
      if (result.isValid) {
        return result
      }
    }
  }

  // Fallback to default IP
  return {
    ip: IP_EXTRACTION_CONFIG.DEFAULT_IP,
    source: 'default',
    isValid: true,
    isPrivate: true,
  }
}

/**
 * Extract and validate IP from header value
 *
 * @param headerValue Raw header value
 * @param source Header name for tracking
 * @returns IPExtractionResult Processed IP result
 */
function extractIPFromHeaderValue(
  headerValue: string,
  source: string,
): IPExtractionResult {
  const originalValue = headerValue

  // Handle comma-separated IPs (x-forwarded-for format)
  let ip = headerValue
  if (ip.includes(',')) {
    // Take the first IP (client IP, not proxy IPs)
    ip = ip.split(',')[0].trim()
  }

  // Basic sanitization
  ip = ip.trim()

  // Remove port if present (IPv4:port format)
  if (ip.includes(':') && !isIPv6(ip)) {
    ip = ip.split(':')[0]
  }

  // Validate IP format
  const isValid = validateIPFormat(ip)
  const isPrivate = isPrivateIP(ip)

  return {
    ip: isValid ? ip : IP_EXTRACTION_CONFIG.DEFAULT_IP,
    source,
    isValid,
    isPrivate,
    originalValue,
  }
}

/**
 * Validate IP address format (IPv4 or IPv6)
 *
 * @param ip IP address string
 * @returns boolean True if valid IP format
 */
export function validateIPFormat(ip: string): boolean {
  if (!ip || typeof ip !== 'string') {
    return false
  }

  // Check IPv4
  if (IP_EXTRACTION_CONFIG.IPV4_PATTERN.test(ip)) {
    // Validate octets are in range 0-255
    const octets = ip.split('.')
    return octets.every((octet) => {
      const num = parseInt(octet, 10)
      return num >= 0 && num <= 255
    })
  }

  // Check IPv6 (basic pattern)
  if (IP_EXTRACTION_CONFIG.IPV6_PATTERN.test(ip)) {
    return true
  }

  return false
}

/**
 * Check if IP is IPv6 format
 *
 * @param ip IP address string
 * @returns boolean True if IPv6 format
 */
export function isIPv6(ip: string): boolean {
  return ip.includes(':') && IP_EXTRACTION_CONFIG.IPV6_PATTERN.test(ip)
}

/**
 * Check if IP is in private range
 *
 * @param ip IP address string
 * @returns boolean True if private IP
 */
export function isPrivateIP(ip: string): boolean {
  if (!validateIPFormat(ip)) {
    return false
  }

  return IP_EXTRACTION_CONFIG.PRIVATE_RANGES.some((pattern) => pattern.test(ip))
}

/**
 * Sanitize IP address for safe storage/logging
 *
 * @param ip IP address string
 * @returns string Sanitized IP address
 */
export function sanitizeIP(ip: string): string {
  if (!ip || typeof ip !== 'string') {
    return IP_EXTRACTION_CONFIG.DEFAULT_IP
  }

  // Remove any non-IP characters (security)
  const sanitized = ip.replace(/[^0-9a-fA-F:.-]/g, '')

  // Validate after sanitization
  if (validateIPFormat(sanitized)) {
    return sanitized
  }

  return IP_EXTRACTION_CONFIG.DEFAULT_IP
}

/**
 * Get IP for cache key generation (simplified, consistent format)
 *
 * @param request Optional NextRequest object
 * @returns Promise<string> IP address suitable for cache keys
 */
export async function getIPForCacheKey(request?: NextRequest): Promise<string> {
  let result: IPExtractionResult

  if (request) {
    result = getClientIPFromRequest(request)
  } else {
    result = await getClientIP()
  }

  // Return sanitized IP for consistent cache key generation
  return sanitizeIP(result.ip)
}
