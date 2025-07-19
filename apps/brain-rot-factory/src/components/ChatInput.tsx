import { Send } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

import { useFingerprint } from '@/hooks/useFingerprint'
import { getRateLimitMessage, useRateLimit } from '@/hooks/useRateLimit'

interface ChatInputProps {
  prompt: string
  setPrompt: (value: string) => void
  isLoading: boolean
  onSubmit: (e: React.FormEvent) => void
  rateLimitRefreshKey?: number
  onRateLimitRefresh?: () => void
}

export default function ChatInput({
  prompt,
  setPrompt,
  isLoading,
  onSubmit,
  rateLimitRefreshKey,
  onRateLimitRefresh,
}: ChatInputProps) {
  const t = useTranslations('Chat')
  const tCommon = useTranslations('common')
  const { rateLimitInfo, checkRateLimit } = useRateLimit()
  const { fingerprint } = useFingerprint()

  // Update rate limit only when refreshKey changes (not on every checkRateLimit change)
  useEffect(() => {
    if (rateLimitRefreshKey > 0) {
      checkRateLimit()
    }
  }, [rateLimitRefreshKey, checkRateLimit])

  const handleWatchAd = async (e: React.MouseEvent) => {
    e.preventDefault()

    try {
      // First, generate a secure ad token
      const tokenResponse = await fetch('/api/rewarded-ad/generate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fingerprintData: fingerprint,
        }),
      })

      if (!tokenResponse.ok) {
        throw new Error('Failed to generate ad token')
      }

      const { adToken } = await tokenResponse.json()

      // Call the actual rewarded ad API endpoint
      const response = await fetch('/api/rewarded-ad/grant-credit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adToken,
          fingerprintData: fingerprint,
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log('Ad credit granted successfully:', result.message)
        // Refresh rate limit info after ad completion
        await checkRateLimit()

        // Notify parent component to refresh rate limit
        if (onRateLimitRefresh) {
          onRateLimitRefresh()
        }
      } else {
        console.error('Failed to grant ad credit:', result.message)
      }
    } catch (error) {
      console.error('Error watching ad:', error)
    }
  }

  const isDisabled =
    isLoading || !prompt.trim() || (rateLimitInfo && !rateLimitInfo.allowed)

  // Check if user has hit the rate limit and show shortened message
  const showShortRateLimitUI = rateLimitInfo && !rateLimitInfo.allowed

  return (
    <div className="border-t border-purple-500/20 p-6">
      <form onSubmit={onSubmit} className="relative">
        {/* Ultra-subtle glassy water container */}
        <div className="relative group">
          {/* Main glassy container - barely visible, water-like */}
          <div className="relative bg-white/3 backdrop-blur-xl rounded-2xl border border-white/5 group-focus-within:border-white/8 group-focus-within:bg-white/5 transition-all duration-500 shadow-lg group-focus-within:shadow-white/5 overflow-hidden flex flex-col">
            {/* Minimal glass shine - like water surface */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-40 group-focus-within:opacity-60 transition-opacity duration-500 pointer-events-none rounded-2xl"></div>

            {/* Very subtle highlight */}
            <div className="absolute top-1 left-2 w-6 h-6 bg-white/8 rounded-full blur-md group-focus-within:bg-white/12 transition-all duration-500 pointer-events-none"></div>

            {/* Main input area with textarea and button */}
            <div className="flex">
              {/* Left section with textarea and rate limit */}
              <div className="flex-1 flex flex-col">
                {/* Textarea - almost invisible, merging with background */}
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  maxLength={500}
                  className="relative z-10 flex-1 h-20 pl-6 pr-4 py-4 bg-transparent text-white/90 placeholder-white/30 focus:outline-none resize-none focus:text-white transition-colors duration-300 overflow-y-auto scrollbar-none"
                  style={
                    {
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      WebkitScrollbar: 'none',
                    } as React.CSSProperties
                  }
                  placeholder={t('placeholder')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (!isDisabled) {
                        onSubmit(e)
                      }
                    }
                  }}
                />

                {/* Rate Limit Info - shortened when limit reached */}
                {showShortRateLimitUI ? (
                  /* Shortened UI when rate limit is reached */
                  <div className="relative z-10 px-6 pb-3 pt-1">
                    <div className="flex items-center justify-center gap-2 text-xs text-white/40">
                      <div className="w-1 h-1 rounded-full bg-orange-300/60 animate-pulse"></div>
                      <div className="flex items-center gap-2">
                        {rateLimitInfo.requiresAuth && (
                          <>
                            <Link
                              href="/auth/signin"
                              className="text-purple-300 hover:text-purple-200 underline transition-colors duration-200"
                            >
                              {t('rateLimit.signInToGetMore')}{' '}
                              {t('rateLimit.toGetMoreGenerations')}
                            </Link>
                            <span className="text-white/40">
                              {' '}
                              {tCommon('or')}{' '}
                            </span>
                          </>
                        )}
                        <Link
                          href="#"
                          onClick={handleWatchAd}
                          className="text-purple-300 hover:text-purple-200 underline transition-colors duration-200"
                        >
                          {t('rateLimit.watchAdForCredit')}
                        </Link>
                        <span className="text-white/40">
                          {' '}
                          {t('rateLimit.watchAdToUnlock')}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : rateLimitInfo ? (
                  /* Normal UI when not at rate limit */
                  <div className="relative z-10 px-6 pb-3 pt-1">
                    <div className="flex items-center justify-center gap-2 text-xs text-white/40">
                      <div className="w-1 h-1 rounded-full bg-white/30 animate-pulse"></div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">
                          {!rateLimitInfo.isLoggedIn &&
                          rateLimitInfo.allowed ? (
                            <>
                              {t('rateLimit.anonymousRemaining', {
                                remaining: rateLimitInfo.remaining,
                              })}{' '}
                              <Link
                                href="/auth/signin"
                                className="text-purple-300 hover:text-purple-200 underline transition-colors duration-200"
                              >
                                {t('rateLimit.signInToGetMore')}
                              </Link>
                              <span className="text-white/40">
                                {' '}
                                {tCommon('or')}{' '}
                              </span>
                              <Link
                                href="#"
                                onClick={handleWatchAd}
                                className="text-purple-300 hover:text-purple-200 underline transition-colors duration-200"
                              >
                                {t('rateLimit.watchAdForCredit')}
                              </Link>
                              <span className="text-white/40">
                                {' '}
                                {t('rateLimit.watchAdToUnlock')}
                              </span>
                            </>
                          ) : rateLimitInfo.isLoggedIn ? (
                            <>
                              {t('rateLimit.userRemaining', {
                                remaining: rateLimitInfo.remaining,
                              })}{' '}
                              <Link
                                href="#"
                                onClick={handleWatchAd}
                                className="text-purple-300 hover:text-purple-200 underline transition-colors duration-200"
                              >
                                {t('rateLimit.watchAdForCredit')}
                              </Link>
                              <span className="text-white/40">
                                {' '}
                                {t('rateLimit.watchAdToUnlock')}
                              </span>
                            </>
                          ) : (
                            getRateLimitMessage(rateLimitInfo, (key, params) =>
                              t(key, params),
                            )
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Loading state */
                  <div className="relative z-10 px-6 pb-3 pt-1">
                    <div className="flex items-center justify-center gap-2 text-xs text-white/30">
                      <div className="w-1 h-1 rounded-full bg-white/20"></div>
                      <span className="text-xs">{t('loadingRateLimit')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Ultra-subtle separator - like water ripple */}
              <div className="relative w-px bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-50 group-focus-within:opacity-70 transition-opacity duration-500"></div>

              {/* Send button - seamlessly integrated, glass-like, full height */}
              <button
                type="submit"
                disabled={isDisabled}
                className="relative flex items-center justify-center w-16 bg-transparent hover:bg-white/5 disabled:bg-transparent transition-all duration-300 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-0 group/send self-stretch"
                title={isLoading ? t('loading') : t('send')}
              >
                {/* Minimal hover effect - like water disturbance */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/3 via-transparent to-transparent opacity-0 group-hover/send:opacity-100 transition-opacity duration-300 rounded-r-2xl"></div>

                {/* Icon - very subtle, water-like */}
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white/40 relative z-10"></div>
                ) : (
                  <Send className="w-5 h-5 text-white/50 relative z-10 group-hover/send:text-white/80 group-hover/send:scale-105 group-disabled/send:text-white/20 transition-all duration-300" />
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
