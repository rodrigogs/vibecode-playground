/**
 * @fileoverview Centralized fingerprint processing utilities
 * Unified fingerprint handling to eliminate code duplication across the application
 */

import {
  type FingerprintComponents,
  type FingerprintResult,
  processFingerprint,
} from '@/lib/browser-fingerprinting'

/**
 * Result type for processed fingerprint data
 */
export interface ProcessedFingerprintData {
  fingerprint?: string
  confidence?: number
  fingerprintResult?: FingerprintResult
}

/**
 * Process fingerprint data from client with enhanced analysis
 *
 * This utility function centralizes fingerprint processing logic to:
 * - Parse JSON fingerprint data safely
 * - Generate fingerprint hash and confidence score
 * - Provide consistent error handling
 * - Return structured fingerprint metadata
 *
 * @param fingerprintData - Raw fingerprint data string from client
 * @returns Processed fingerprint data with hash, confidence, and full result
 *
 * @example
 * ```typescript
 * const { fingerprint, confidence } = processFingerprintData(rawData)
 * if (fingerprint && confidence && confidence > 0.8) {
 *   // High confidence fingerprint available
 * }
 * ```
 */
export function processFingerprintData(
  fingerprintData?: string,
): ProcessedFingerprintData {
  if (!fingerprintData) {
    return {}
  }

  try {
    const components: FingerprintComponents = JSON.parse(fingerprintData)
    const result: FingerprintResult = processFingerprint(components)

    return {
      fingerprint: result.fingerprint,
      confidence: result.confidence,
      fingerprintResult: result,
    }
  } catch (error) {
    console.warn('Failed to process fingerprint data:', error)
    return {}
  }
}

/**
 * Extract fingerprint hash from fingerprint data
 * Convenience function for cases where only the hash is needed
 *
 * @param fingerprintData - Raw fingerprint data string from client
 * @returns Fingerprint hash string or undefined if processing fails
 */
export function extractFingerprintHash(
  fingerprintData?: string,
): string | undefined {
  const { fingerprint } = processFingerprintData(fingerprintData)
  return fingerprint
}

/**
 * Check if fingerprint data has high confidence
 * Utility for confidence-based fingerprint validation
 *
 * @param fingerprintData - Raw fingerprint data string from client
 * @param threshold - Minimum confidence threshold (default: 0.8)
 * @returns True if fingerprint has confidence above threshold
 */
export function hasHighConfidenceFingerprint(
  fingerprintData?: string,
  threshold: number = 0.8,
): boolean {
  const { confidence } = processFingerprintData(fingerprintData)
  return confidence !== undefined && confidence >= threshold
}

/**
 * Get fingerprint metadata for logging/debugging
 * Provides structured fingerprint information for monitoring
 *
 * @param fingerprintData - Raw fingerprint data string from client
 * @returns Fingerprint metadata or null if processing fails
 */
export function getFingerprintMetadata(fingerprintData?: string): {
  hasFingerprint: boolean
  confidence?: number
  hash?: string
  components?: FingerprintComponents
} | null {
  if (!fingerprintData) {
    return { hasFingerprint: false }
  }

  const { fingerprint, confidence, fingerprintResult } =
    processFingerprintData(fingerprintData)

  if (!fingerprintResult) {
    return null
  }

  try {
    const components: FingerprintComponents = JSON.parse(fingerprintData)
    return {
      hasFingerprint: true,
      confidence,
      hash: fingerprint,
      components,
    }
  } catch {
    return null
  }
}
