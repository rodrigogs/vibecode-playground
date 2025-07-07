import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'

import { routing } from '@/i18n/routing'

// Create the internationalization middleware once
const intlMiddleware = createIntlMiddleware(routing)

// Add security headers to API endpoints
async function addSecurityHeaders(
  request: NextRequest,
): Promise<NextResponse | null> {
  const url = new URL(request.url)

  // Add security headers to API endpoints
  if (url.pathname.startsWith('/api/')) {
    // Skip for auth endpoints (they handle their own headers)
    if (url.pathname.includes('/auth/')) {
      return null
    }

    // Add security headers for API endpoints
    const response = NextResponse.next()
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')

    return response
  }

  return null
}

export async function middleware(request: NextRequest) {
  const url = new URL(request.url)

  // Add security headers first
  const securityResponse = await addSecurityHeaders(request)
  if (securityResponse) {
    return securityResponse
  }

  // Skip i18n handling for auth endpoints
  if (url.pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  return intlMiddleware(request)
}

export default middleware

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',
    // Set a cookie to remember the previous locale for all requests that have locale prefixes
    '/(en|pt|id|it)/:path*',
    // Enable redirects that add missing locales (e.g. `/pathnames` -> `/en/pathnames`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // Add API routes to matcher for security headers
    '/api/(.*)',
  ],
}
