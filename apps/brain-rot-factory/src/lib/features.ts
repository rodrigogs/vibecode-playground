/**
 * Feature flags and configuration utilities
 */

/**
 * Check if rewards/ad system is enabled
 * @returns true if ENABLE_REWARDS is set to 'true' or not set (default: true)
 */
export function isRewardsEnabled(): boolean {
  // Use Next.js environment variable (available on both server and client)
  const enableRewards = process.env.ENABLE_REWARDS
  // Default to false is not set
  return enableRewards?.toUpperCase() === 'TRUE'
}
