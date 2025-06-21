import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth-instance'
import { getRateLimitStatus } from '@/lib/rate-limit'

export async function GET() {
  try {
    const session = await auth()
    const rateLimitStatus = await getRateLimitStatus(session)

    return NextResponse.json(rateLimitStatus)
  } catch (error) {
    console.error('Rate limit check error:', error)
    return NextResponse.json(
      { error: 'Failed to check rate limit' },
      { status: 500 },
    )
  }
}
