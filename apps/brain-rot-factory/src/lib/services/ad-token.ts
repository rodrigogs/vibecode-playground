import { randomBytes } from 'crypto'
import jwt from 'jsonwebtoken'

import { cache } from '@/lib/backend-cache'
import { isRewardsEnabled } from '@/lib/features'

/**
 * Ad Token Service
 *
 * Provides secure JWT-based ad token generation and validation
 * with proper cryptographic signing, expiration, and replay protection.
 */

export interface AdTokenPayload {
  type: 'ad_completion'
  fingerprint: string
  nonce: string
  iat: number
  exp: number
  jti: string // JWT ID for token blacklisting
}

export interface AdTokenValidationResult {
  valid: boolean
  reason?: string
  payload?: AdTokenPayload
}

// Environment variables
const AD_TOKEN_SECRET = process.env.AD_TOKEN_SECRET || process.env.AUTH_SECRET
const AD_TOKEN_EXPIRY = 5 * 60 // 5 minutes in seconds

// Only require secrets if rewards are enabled
if (isRewardsEnabled() && !AD_TOKEN_SECRET) {
  throw new Error(
    'AD_TOKEN_SECRET or AUTH_SECRET must be defined when rewards are enabled',
  )
}

/**
 * Generates a secure ad token with JWT signing
 */
export async function generateAdToken(fingerprint: string): Promise<string> {
  if (!isRewardsEnabled()) {
    throw new Error('Rewards system is disabled')
  }

  if (!AD_TOKEN_SECRET) {
    throw new Error(
      'AD_TOKEN_SECRET or AUTH_SECRET must be defined when rewards are enabled',
    )
  }

  // Generate cryptographically secure nonce
  const nonce = randomBytes(16).toString('hex')

  // Generate unique JWT ID
  const jti = randomBytes(16).toString('hex')

  const now = Math.floor(Date.now() / 1000)

  const payload: AdTokenPayload = {
    type: 'ad_completion',
    fingerprint,
    nonce,
    iat: now,
    exp: now + AD_TOKEN_EXPIRY,
    jti,
  }

  // Sign the token with the secret
  const token = jwt.sign(payload, AD_TOKEN_SECRET, {
    algorithm: 'HS256',
    // Don't use expiresIn since we already have exp in payload
  })

  // Store the token in cache to track valid tokens
  const tokenKey = `ad_token:valid:${jti}`
  try {
    await cache.set(tokenKey, fingerprint, AD_TOKEN_EXPIRY * 1000) // Convert seconds to milliseconds
  } catch (error) {
    console.warn('Failed to store ad token in cache:', error)
    // Continue - token is still valid, just can't track it
  }

  return token
}

/**
 * Validates an ad token with comprehensive security checks
 */
export async function validateAdToken(
  token: string,
  expectedFingerprint: string,
): Promise<AdTokenValidationResult> {
  if (!isRewardsEnabled()) {
    return { valid: false, reason: 'Rewards system is disabled' }
  }

  if (!AD_TOKEN_SECRET) {
    return { valid: false, reason: 'AD_TOKEN_SECRET not configured' }
  }

  // Basic input validation
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'Invalid token format' }
  }

  if (!expectedFingerprint || typeof expectedFingerprint !== 'string') {
    return { valid: false, reason: 'Invalid fingerprint' }
  }

  try {
    // Verify JWT signature and decode payload
    const decoded = jwt.verify(token, AD_TOKEN_SECRET, {
      algorithms: ['HS256'],
    }) as AdTokenPayload

    // Validate token structure
    if (decoded.type !== 'ad_completion') {
      return { valid: false, reason: 'Invalid token type' }
    }

    // Validate fingerprint match
    if (decoded.fingerprint !== expectedFingerprint) {
      return { valid: false, reason: 'Fingerprint mismatch' }
    }

    // Check if token is expired (JWT library handles this, but double-check)
    const now = Math.floor(Date.now() / 1000)
    if (decoded.exp <= now) {
      return { valid: false, reason: 'Token expired' }
    }

    // Check if token has been used (replay protection)
    const usedTokenKey = `ad_token:used:${decoded.jti}`
    const isUsed = await cache.get(usedTokenKey)

    if (isUsed) {
      return { valid: false, reason: 'Token already used' }
    }

    // Check if token is in valid token cache
    const validTokenKey = `ad_token:valid:${decoded.jti}`
    const storedFingerprint = await cache.get(validTokenKey)

    if (!storedFingerprint) {
      return { valid: false, reason: 'Token not found in valid tokens' }
    }

    if (storedFingerprint !== expectedFingerprint) {
      return { valid: false, reason: 'Stored fingerprint mismatch' }
    }

    // Mark token as used to prevent replay attacks
    try {
      await cache.set(usedTokenKey, 'used', 24 * 60 * 60 * 1000) // 24 hours in milliseconds
      // Remove from valid tokens cache
      await cache.delete(validTokenKey)
    } catch (error) {
      console.warn('Failed to mark token as used:', error)
      // Continue - validation is still successful
    }

    return { valid: true, payload: decoded }
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, reason: 'Invalid token signature' }
    }
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, reason: 'Token expired' }
    }
    if (error instanceof jwt.NotBeforeError) {
      return { valid: false, reason: 'Token not yet valid' }
    }

    console.error('Ad token validation error:', error)
    return { valid: false, reason: 'Token validation failed' }
  }
}

/**
 * Revokes a token by adding it to the blacklist
 */
export async function revokeAdToken(jti: string): Promise<void> {
  if (!isRewardsEnabled()) {
    throw new Error('Rewards system is disabled')
  }

  const blacklistKey = `ad_token:blacklist:${jti}`
  try {
    await cache.set(blacklistKey, 'revoked', 24 * 60 * 60 * 1000) // 24 hours in milliseconds
  } catch (error) {
    console.error('Failed to revoke token:', error)
    throw error
  }
}

/**
 * Checks if a token is blacklisted
 */
export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  if (!isRewardsEnabled()) {
    return false // If rewards are disabled, no tokens are blacklisted
  }

  const blacklistKey = `ad_token:blacklist:${jti}`
  try {
    const result = await cache.get(blacklistKey)
    return result !== null
  } catch (error) {
    console.error('Failed to check token blacklist:', error)
    return false // Fail open - don't block valid tokens due to cache issues
  }
}

/**
 * Cleanup expired tokens from cache
 */
export async function cleanupExpiredTokens(): Promise<void> {
  // This would typically be handled by cache TTL
  // But could be implemented for manual cleanup if needed
  console.log('Token cleanup - handled by cache TTL')
}

/**
 * Gets token information without validation (for debugging)
 */
export function decodeAdTokenUnsafe(token: string): AdTokenPayload | null {
  try {
    return jwt.decode(token) as AdTokenPayload
  } catch {
    return null
  }
}
