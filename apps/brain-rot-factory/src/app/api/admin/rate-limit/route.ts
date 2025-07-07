import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth-instance'
import {
  getRateLimitDebugInfo,
  resetIPRateLimit,
  resetUserRateLimit,
} from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()

    // Only allow logged-in users to view debug info
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const debugInfo = await getRateLimitDebugInfo()

    return NextResponse.json({
      ipKeys: debugInfo.ipKeys,
      userKeys: debugInfo.userKeys,
      totalIpEntries: debugInfo.ipKeys.length,
      totalUserEntries: debugInfo.userKeys.length,
    })
  } catch {
    // Rate limit debug error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()

    // Only allow logged-in users to reset rate limits
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, target } = body

    if (type === 'ip' && target) {
      await resetIPRateLimit(target)
      return NextResponse.json({
        success: true,
        message: `Reset IP: ${target}`,
      })
    } else if (type === 'user' && target) {
      await resetUserRateLimit(target)
      return NextResponse.json({
        success: true,
        message: `Reset user: ${target}`,
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid request. Provide type (ip/user) and target.' },
        { status: 400 },
      )
    }
  } catch {
    // Rate limit reset error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
