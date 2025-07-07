import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'

import { routing } from '@/i18n/routing'

// Create the internationalization middleware once
const intlMiddleware = createIntlMiddleware(routing)

// Pass through crawler control panel without locale redirects
export function middleware(request: NextRequest) {
  const url = new URL(request.url)
  if (url.pathname.startsWith('/crawler')) {
    // Skip i18n handling for crawler dashboard and assets
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
  ],
}
