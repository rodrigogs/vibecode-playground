import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth-instance'
import { getRateLimitStatus } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Get fingerprint data from query parameters or headers
    const url = new URL(request.url)
    const fingerprintData =
      url.searchParams.get('fingerprint') ||
      request.headers.get('x-fingerprint')

    console.log('📊 [RATE LIMIT CHECK] Session user ID:', session?.user?.id)
    console.log(
      '📊 [RATE LIMIT CHECK] Fingerprint data available:',
      !!fingerprintData,
    )

    // Include fingerprint data to match the chat API behavior
    const rateLimitStatus = await getRateLimitStatus(
      session,
      fingerprintData || undefined,
    )

    // Log only essential information, not the full object with limit
    console.log('📊 [RATE LIMIT CHECK] Status result:', {
      allowed: rateLimitStatus.allowed,
      remaining: rateLimitStatus.remaining,
      resetTime: rateLimitStatus.resetTime,
      requiresAuth: rateLimitStatus.requiresAuth,
      isLoggedIn: rateLimitStatus.isLoggedIn,
      method: rateLimitStatus.method,
    })

    // Return simplified response without exposing internal limit details
    return NextResponse.json({
      allowed: rateLimitStatus.allowed,
      remaining: rateLimitStatus.remaining,
      resetTime: rateLimitStatus.resetTime,
      requiresAuth: rateLimitStatus.requiresAuth,
      isLoggedIn: rateLimitStatus.isLoggedIn,
      method: rateLimitStatus.method,
    })
  } catch {
    // Rate limit check error
    return NextResponse.json(
      { error: 'Failed to check rate limit' },
      { status: 500 },
    )
  }
}
