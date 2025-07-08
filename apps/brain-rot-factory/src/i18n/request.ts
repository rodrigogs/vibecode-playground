import { getRequestConfig } from 'next-intl/server'

import { mergeMessages } from '@/messages'

// Can be imported from a shared config
export const locales = ['en', 'pt', 'id', 'it', 'ja', 'zh'] as const
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
    messages: await mergeMessages(locale),
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
