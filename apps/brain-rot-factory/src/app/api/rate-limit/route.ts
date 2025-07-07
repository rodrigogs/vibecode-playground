import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth-instance'
import { getRateLimitStatus } from '@/lib/rate-limit'

export async function GET() {
  try {
    const session = await auth()
    // Note: For the status endpoint, we don't require fingerprint data
    const rateLimitStatus = await getRateLimitStatus(session)

    return NextResponse.json(rateLimitStatus)
  } catch {
    // Rate limit check error
    return NextResponse.json(
      { error: 'Failed to check rate limit' },
      { status: 500 },
    )
  }
}
