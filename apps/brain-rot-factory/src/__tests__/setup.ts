import { vi } from 'vitest'

// Mock isRewardsEnabled to return true for all tests
vi.mock('@/lib/features', () => ({
  isRewardsEnabled: vi.fn(() => true),
}))

// Set up environment variables for tests
process.env.ENABLE_REWARDS = 'true'
process.env.AUTH_SECRET = 'test-secret-key-for-jwt-signing'
process.env.AD_TOKEN_SECRET = 'test-secret-key-for-jwt-signing'
