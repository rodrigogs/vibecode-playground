import createIntlMiddleware from 'next-intl/middleware'

import { routing } from '@/i18n/routing'

// Create the internationalization middleware
export default createIntlMiddleware(routing)

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',
    // Set a cookie to remember the previous locale for all requests that have a locale prefix
    '/(pt|en)/:path*',
    // Enable redirects that add missing locales (e.g. `/pathnames` -> `/en/pathnames`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
