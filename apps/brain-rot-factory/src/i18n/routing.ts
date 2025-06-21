import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'pt', 'id', 'it'],

  // Used when no locale matches
  defaultLocale: 'en',

  // The `pathnames` object holds pairs of internal and
  // external paths. Based on the locale, the external
  // paths are rewritten to the shared, internal ones.
  pathnames: {
    // If all locales use the same pathname, a single
    // external path can be provided for all locales
    '/': '/',
    '/auth/signin': {
      en: '/auth/signin',
      pt: '/auth/entrar',
      id: '/auth/masuk',
      it: '/auth/accedi',
    },
  },
})

// Lightweight wrappers around Next.js' routing APIs
// that will consider the routing configuration
export type Pathnames = keyof typeof routing.pathnames
export type Locale = (typeof routing.locales)[number]
