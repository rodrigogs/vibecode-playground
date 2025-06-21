'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

export default function SignIn() {
  const t = useTranslations('Auth')
  const params = useParams()
  const locale = params.locale as string
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})

  const handleSignIn = async (provider: string) => {
    setIsLoading((prev) => ({ ...prev, [provider]: true }))
    try {
      await signIn(provider, { callbackUrl: '/' })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading((prev) => ({ ...prev, [provider]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-2xl border border-white/20 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('loginTitle')}
          </h1>
          <p className="text-white/70">{t('loginSubtitle')}</p>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => handleSignIn('github')}
            disabled={isLoading.github}
            className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading.github ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {t('continueWith', { provider: 'GitHub' })}
          </button>

          {/* Placeholder for future providers */}
          <div className="pt-4 border-t border-white/20">
            <p className="text-center text-white/50 text-sm">
              {t('moreProviders')}
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm">
            {t('termsPrefix')}{' '}
            <Link
              href={`/${locale}/terms`}
              className="text-blue-300 hover:text-blue-200 underline cursor-pointer transition-colors duration-200"
            >
              {t('termsLink')}
            </Link>{' '}
            {t('termsAndText')}{' '}
            <Link
              href={`/${locale}/privacy`}
              className="text-blue-300 hover:text-blue-200 underline cursor-pointer transition-colors duration-200"
            >
              {t('privacyLink')}
            </Link>
            {t('termsSuffix')}
          </p>
        </div>
      </div>
    </div>
  )
}
