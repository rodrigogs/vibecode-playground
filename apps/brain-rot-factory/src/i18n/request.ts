import { getRequestConfig } from 'next-intl/server'

// Can be imported from a shared config
export const locales = ['en', 'pt', 'id', 'it'] as const
export const defaultLocale = 'en' as const

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale

  // Ensure that a valid locale is used
  if (!locale || !locales.includes(locale as (typeof locales)[number])) {
    locale = defaultLocale
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'America/Sao_Paulo', // Default timezone for PT-BR
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        },
      },
    },
  }
})
