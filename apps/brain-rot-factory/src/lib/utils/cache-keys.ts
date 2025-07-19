/**
 * Centralized cache key generation utilities
 * Eliminates code duplication across the application
 */

// Cache key prefixes and patterns
export const CACHE_PREFIXES = {
  RATE_LIMIT: 'rate_limit',
  AD_LIMIT: 'ad_limit',
  BONUS_CREDITS: 'bonus_credits',
  AD_TOKEN: 'ad_token',
  TTS_TOKEN: 'tts_token',
  USER_SESSION: 'user_session',
  FINGERPRINT: 'fingerprint',
} as const

// Time period suffixes
export const TIME_PERIODS = {
  HOURLY: 'hourly',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const

// Identifier types
export const IDENTIFIER_TYPES = {
  IP: 'ip',
  USER: 'user',
  FINGERPRINT: 'fingerprint',
  COMBINED: 'combined',
} as const

/**
 * Interface for cache key generation options
 */
export interface CacheKeyOptions {
  prefix: string
  type: string
  identifier: string
  period?: string
  suffix?: string
}

/**
 * Generate a standardized cache key
 */
export function generateCacheKey(options: CacheKeyOptions): string {
  const { prefix, type, identifier, period, suffix } = options

  let key = `${prefix}:${type}`

  if (period) {
    key += `:${period}`
  }

  key += `:${identifier}`

  if (suffix) {
    key += `:${suffix}`
  }

  return key
}

/**
 * Rate limit cache key generators
 */
export class RateLimitKeys {
  /**
   * Generate IP-based rate limit key
   */
  static ip(ip: string): string {
    return generateCacheKey({
      prefix: CACHE_PREFIXES.RATE_LIMIT,
      type: IDENTIFIER_TYPES.IP,
      identifier: ip,
    })
  }

  /**
   * Generate user-based rate limit key
   */
  static user(userId: string): string {
    return generateCacheKey({
      prefix: CACHE_PREFIXES.RATE_LIMIT,
      type: IDENTIFIER_TYPES.USER,
      identifier: userId,
    })
  }

  /**
   * Generate fingerprint-based rate limit key
   */
  static fingerprint(fingerprint: string): string {
    return generateCacheKey({
      prefix: CACHE_PREFIXES.RATE_LIMIT,
      type: IDENTIFIER_TYPES.FINGERPRINT,
      identifier: fingerprint,
    })
  }

  /**
   * Generate combined rate limit key (IP + fingerprint)
   */
  static combined(ip: string, fingerprint: string): string {
    return generateCacheKey({
      prefix: CACHE_PREFIXES.RATE_LIMIT,
      type: IDENTIFIER_TYPES.COMBINED,
      identifier: `${ip}:${fingerprint}`,
    })
  }

  /**
   * Generate rate limit keys for different strategies
   */
  static getKeys(ip: string, fingerprint?: string) {
    const ipKey = this.ip(ip)
    const fingerprintKey = fingerprint ? this.fingerprint(fingerprint) : null
    const combinedKey = fingerprint ? this.combined(ip, fingerprint) : null

    return {
      ip: ipKey,
      fingerprint: fingerprintKey,
      combined: combinedKey,
    }
  }

  /**
   * Generate burst rate limit key for any identifier and method
   */
  static burst(
    identifier: string,
    method: 'ip' | 'fingerprint' | 'combined' | 'user' = 'ip',
  ): string {
    return generateCacheKey({
      prefix: CACHE_PREFIXES.RATE_LIMIT,
      type: `burst_${method}`,
      identifier: identifier,
    })
  }
}

/**
 * Ad limit cache key generators
 */
export class AdLimitKeys {
  /**
   * Generate hourly ad limit key for user
   */
  static userHourly(userId: string): string {
    return generateCacheKey({
      prefix: CACHE_PREFIXES.AD_LIMIT,
      type: IDENTIFIER_TYPES.USER,
      period: TIME_PERIODS.HOURLY,
      identifier: userId,
    })
  }

  /**
   * Generate daily ad limit key for user
   */
  static userDaily(userId: string): string {
    return generateCacheKey({
      prefix: CACHE_PREFIXES.AD_LIMIT,
      type: IDENTIFIER_TYPES.USER,
      period: TIME_PERIODS.DAILY,
      identifier: userId,
    })
  }

  /**
   * Generate hourly ad limit key for fingerprint
   */
  static fingerprintHourly(fingerprint: string): string {
    return generateCacheKey({
      prefix: CACHE_PREFIXES.AD_LIMIT,
      type: IDENTIFIER_TYPES.FINGERPRINT,
      period: TIME_PERIODS.HOURLY,
      identifier: fingerprint,
    })
  }

  /**
   * Generate daily ad limit key for fingerprint
   */
  static fingerprintDaily(fingerprint: string): string {
    return generateCacheKey({
      prefix: CACHE_PREFIXES.AD_LIMIT,
      type: IDENTIFIER_TYPES.FINGERPRINT,
      period: TIME_PERIODS.DAILY,
      identifier: fingerprint,
    })
  }

  /**
   * Generate hourly ad limit key for IP
   */
  static ipHourly(ip: string): string {
    return generateCacheKey({
      prefix: CACHE_PREFIXES.AD_LIMIT,
      type: IDENTIFIER_TYPES.IP,
      period: TIME_PERIODS.HOURLY,
      identifier: ip,
    })
  }

  /**
   * Generate daily ad limit key for IP
   */
  static ipDaily(ip: string): string {
    return generateCacheKey({
      prefix: CACHE_PREFIXES.AD_LIMIT,
      type: IDENTIFIER_TYPES.IP,
      period: TIME_PERIODS.DAILY,
      identifier: ip,
    })
  }

  /**
   * Generate ad limit keys based on available identifiers
   */
  static getKeys(userId?: string, fingerprint?: string, ip?: string) {
    const keys = {
      hourly: userId
        ? this.userHourly(userId)
        : fingerprint
          ? this.fingerprintHourly(fingerprint)
          : ip
            ? this.ipHourly(ip)
            : null,
      daily: userId
        ? this.userDaily(userId)
        : fingerprint
          ? this.fingerprintDaily(fingerprint)
          : ip
            ? this.ipDaily(ip)
            : null,
    }

    return keys
  }
}

/**
 * Bonus credits cache key generators
 */
export class BonusCreditsKeys {
  /**
   * Generate bonus credits key for user
   */
  static user(userId: string): string {
    return generateCacheKey({
      prefix: CACHE_PREFIXES.BONUS_CREDITS,
      type: IDENTIFIER_TYPES.USER,
      identifier: userId,
    })
  }

  /**
   * Generate bonus credits key for IP
   */
  static ip(ip: string): string {
    return generateCacheKey({
      prefix: CACHE_PREFIXES.BONUS_CREDITS,
      type: IDENTIFIER_TYPES.IP,
      identifier: ip,
    })
  }

  /**
   * Generate bonus credits key based on available identifier
   */
  static getKey(userId?: string, ip?: string): string {
    if (userId) {
      return this.user(userId)
    }
    if (ip) {
      return this.ip(ip)
    }
    throw new Error(
      'Either userId or ip must be provided for bonus credits key',
    )
  }
}

/**
 * Ad token cache key generators
 */
export class AdTokenKeys {
  /**
   * Generate ad token storage key
   */
  static token(tokenId: string): string {
    return generateCacheKey({
      prefix: CACHE_PREFIXES.AD_TOKEN,
      type: 'storage',
      identifier: tokenId,
    })
  }

  /**
   * Generate ad token blacklist key
   */
  static blacklist(tokenId: string): string {
    return generateCacheKey({
      prefix: CACHE_PREFIXES.AD_TOKEN,
      type: 'blacklist',
      identifier: tokenId,
    })
  }

  /**
   * Generate ad token usage key
   */
  static usage(tokenId: string): string {
    return generateCacheKey({
      prefix: CACHE_PREFIXES.AD_TOKEN,
      type: 'used',
      identifier: tokenId,
    })
  }
}

/**
 * TTS token cache key generators
 */
export class TTSTokenKeys {
  /**
   * Generate TTS token storage key
   */
  static token(tokenId: string): string {
    return generateCacheKey({
      prefix: CACHE_PREFIXES.TTS_TOKEN,
      type: 'storage',
      identifier: tokenId,
    })
  }

  /**
   * Generate TTS audio cache key
   */
  static audio(contentHash: string): string {
    return generateCacheKey({
      prefix: CACHE_PREFIXES.TTS_TOKEN,
      type: 'audio',
      identifier: contentHash,
    })
  }

  /**
   * Generate TTS rate limit key
   */
  static rateLimit(identifier: string): string {
    return generateCacheKey({
      prefix: CACHE_PREFIXES.TTS_TOKEN,
      type: 'rate_limit',
      identifier: identifier,
    })
  }
}

/**
 * Utility functions for cache key operations
 */
export class CacheKeyUtils {
  /**
   * Check if a key matches a specific prefix
   */
  static hasPrefix(key: string, prefix: string): boolean {
    return key.startsWith(`${prefix}:`)
  }

  /**
   * Extract the identifier from a cache key
   */
  static extractIdentifier(key: string): string | null {
    const parts = key.split(':')
    return parts.length >= 3 ? parts[parts.length - 1] : null
  }

  /**
   * Check if a key is a rate limit key
   */
  static isRateLimitKey(key: string): boolean {
    return this.hasPrefix(key, CACHE_PREFIXES.RATE_LIMIT)
  }

  /**
   * Check if a key is an ad limit key
   */
  static isAdLimitKey(key: string): boolean {
    return this.hasPrefix(key, CACHE_PREFIXES.AD_LIMIT)
  }

  /**
   * Check if a key is a bonus credits key
   */
  static isBonusCreditsKey(key: string): boolean {
    return this.hasPrefix(key, CACHE_PREFIXES.BONUS_CREDITS)
  }

  /**
   * Parse a cache key into its components
   */
  static parseKey(key: string): {
    prefix: string
    type: string
    period?: string
    identifier: string
  } | null {
    const parts = key.split(':')
    if (parts.length < 3) return null

    const prefix = parts[0]
    const type = parts[1]

    // Handle keys with periods (e.g., ad_limit:user:hourly:123)
    if (parts.length === 4) {
      return {
        prefix,
        type,
        period: parts[2],
        identifier: parts[3],
      }
    }

    // Handle keys without periods (e.g., rate_limit:ip:192.168.1.1)
    return {
      prefix,
      type,
      identifier: parts.slice(2).join(':'), // Handle IPs with colons
    }
  }
}

// Export commonly used key generators for convenience
export const cacheKeys = {
  rateLimit: RateLimitKeys,
  adLimit: AdLimitKeys,
  bonusCredits: BonusCreditsKeys,
  adToken: AdTokenKeys,
  ttsToken: TTSTokenKeys,
  utils: CacheKeyUtils,
}
