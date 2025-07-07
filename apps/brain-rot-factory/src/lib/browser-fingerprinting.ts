/**
 * Advanced Browser Fingerprinting for Rate Limiting
 *
 * This module implements multiple fingerprinting techniques to create
 * a more reliable user identifier for rate limiting purposes.
 * Combines multiple signals to create a stable, unique identifier.
 */

export interface FingerprintComponents {
  // Basic browser info
  userAgent: string
  language: string
  timezone: string

  // Screen characteristics
  screenResolution: string
  colorDepth: number
  devicePixelRatio: number

  // Hardware signals
  hardwareConcurrency: number
  deviceMemory?: number

  // Canvas fingerprint
  canvasFingerprint: string

  // WebGL fingerprint
  webglFingerprint: string

  // Audio fingerprint
  audioFingerprint: string

  // Feature detection
  featureSupport: string

  // Font detection
  fontFingerprint: string

  // Plugin detection
  pluginFingerprint: string

  // Session-specific
  sessionId: string

  // Automation detection
  automationFlags: string
}

export interface FingerprintResult {
  fingerprint: string
  components: FingerprintComponents
  confidence: number // 0-1 scale
  entropy: number // bits of entropy
  suspiciousFlags: string[] // Array of detected suspicious behaviors
}

/**
 * Hash function for generating stable fingerprints
 */
export function hashFingerprint(data: string): string {
  let hash = 0
  if (data.length === 0) return hash.toString()

  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36)
}

/**
 * Calculate Shannon entropy of a string
 */
export function calculateEntropy(str: string): number {
  const frequencies: { [key: string]: number } = {}

  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1
  }

  const length = str.length
  let entropy = 0

  for (const freq of Object.values(frequencies)) {
    const probability = freq / length
    entropy -= probability * Math.log2(probability)
  }

  return entropy
}

/**
 * Analyze automation flags for suspicious behavior
 */
function analyzeSuspiciousFlags(automationFlags: string): string[] {
  const flags = automationFlags.split(',').filter((f) => f.length > 0)
  const suspicious: string[] = []

  // High suspicion flags
  if (flags.includes('webdriver')) suspicious.push('webdriver-detected')
  if (flags.includes('headless-chrome')) suspicious.push('headless-browser')
  if (flags.includes('phantomjs')) suspicious.push('phantomjs-detected')

  // Medium suspicion flags
  if (flags.includes('no-plugins')) suspicious.push('no-plugins')
  if (flags.includes('no-window')) suspicious.push('no-window')
  if (flags.includes('chrome-automation')) suspicious.push('chrome-automation')

  // Low suspicion but worth noting
  if (flags.includes('high-cores') && flags.includes('high-memory')) {
    suspicious.push('server-grade-hardware')
  }

  return suspicious
}

/**
 * Process collected fingerprint components
 */
export function processFingerprint(
  components: FingerprintComponents,
): FingerprintResult {
  // Create composite fingerprint
  const compositeData = [
    components.userAgent,
    components.language,
    components.timezone,
    components.screenResolution,
    components.colorDepth.toString(),
    components.devicePixelRatio.toString(),
    components.hardwareConcurrency.toString(),
    components.deviceMemory?.toString() || 'unknown',
    components.canvasFingerprint,
    components.webglFingerprint,
    components.audioFingerprint,
    components.featureSupport,
    components.fontFingerprint,
    components.pluginFingerprint,
    components.automationFlags,
  ].join('|')

  const fingerprint = hashFingerprint(compositeData)
  const entropy = calculateEntropy(compositeData)
  const suspiciousFlags = analyzeSuspiciousFlags(components.automationFlags)

  // Calculate confidence based on entropy and component availability
  let confidence = Math.min(entropy / 20, 1) // Normalize entropy to 0-1

  // Adjust confidence based on component quality
  if (
    components.canvasFingerprint &&
    components.canvasFingerprint !== 'no-canvas' &&
    components.canvasFingerprint !== 'canvas-error'
  ) {
    confidence += 0.1
  }
  if (
    components.webglFingerprint &&
    components.webglFingerprint !== 'no-webgl' &&
    components.webglFingerprint !== 'webgl-error'
  ) {
    confidence += 0.1
  }
  if (
    components.audioFingerprint &&
    components.audioFingerprint !== 'audio-error'
  ) {
    confidence += 0.05
  }

  // Reduce confidence for suspicious behavior
  if (suspiciousFlags.length > 0) {
    confidence = Math.max(0.1, confidence - suspiciousFlags.length * 0.1)
  }

  // Ensure confidence is between 0 and 1
  confidence = Math.max(0, Math.min(1, confidence))

  return {
    fingerprint,
    components,
    confidence,
    entropy,
    suspiciousFlags,
  }
}
