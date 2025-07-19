// Centralized rate limit constants and messages
export const RATE_LIMIT_CONFIG = {
  IP_LIMIT: 3,
  USER_DAILY_LIMIT: 10,
  RESET_TIME_HOURS: 24,
} as const

// API response messages (for backwards compatibility)
export const RATE_LIMIT_MESSAGES = {
  IP_LIMIT_EXCEEDED: `You have reached your limit of ${RATE_LIMIT_CONFIG.IP_LIMIT} generations. Please sign in to continue with up to ${RATE_LIMIT_CONFIG.USER_DAILY_LIMIT} generations per day.`,
  USER_LIMIT_EXCEEDED: `You have reached your daily limit of ${RATE_LIMIT_CONFIG.USER_DAILY_LIMIT} generations. More ways to get additional generations coming soon!`,
  ANONYMOUS_REMAINING: (remaining: number) =>
    `${remaining} generations remaining.`,
  ANONYMOUS_SIGN_IN_PROMPT: (remaining: number) =>
    remaining <= 1
      ? ` Sign in to get ${RATE_LIMIT_CONFIG.USER_DAILY_LIMIT} generations per day.`
      : ` Sign in to get up to ${RATE_LIMIT_CONFIG.USER_DAILY_LIMIT} generations per day.`,
  USER_REMAINING: (remaining: number) =>
    `${remaining} daily generations remaining. More ways to get additional generations coming soon!`,
} as const
