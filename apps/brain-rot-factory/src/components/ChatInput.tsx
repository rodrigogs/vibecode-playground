import { Send } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

import {
  formatTimeUntilReset,
  getRateLimitMessage,
  useRateLimit,
} from '@/hooks/useRateLimit'

interface ChatInputProps {
  prompt: string
  setPrompt: (value: string) => void
  isLoading: boolean
  onSubmit: (e: React.FormEvent) => void
  rateLimitRefreshKey?: number
}

export default function ChatInput({
  prompt,
  setPrompt,
  isLoading,
  onSubmit,
  rateLimitRefreshKey,
}: ChatInputProps) {
  const t = useTranslations('Chat')
  const { rateLimitInfo, timeUntilReset, checkRateLimit } = useRateLimit()

  // Update rate limit when refreshRateLimit prop changes
  useEffect(() => {
    checkRateLimit()
  }, [rateLimitRefreshKey, checkRateLimit])

  const isDisabled =
    isLoading || !prompt.trim() || (rateLimitInfo && !rateLimitInfo.allowed)

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

                {/* Rate Limit Info - integrated at bottom with glassy style */}
                {rateLimitInfo ? (
                  <div className="relative z-10 px-6 pb-3 pt-1">
                    <div className="flex items-center justify-center gap-2 text-xs text-white/40">
                      <div className="w-1 h-1 rounded-full bg-white/30 animate-pulse"></div>
                      <span className="text-xs">
                        {rateLimitInfo.requiresAuth &&
                        !rateLimitInfo.allowed ? (
                          <>
                            You have reached your limit. Please{' '}
                            <Link
                              href="/auth/signin"
                              className="text-purple-300 hover:text-purple-200 underline transition-colors duration-200"
                            >
                              sign in
                            </Link>{' '}
                            to continue with more generations.
                          </>
                        ) : !rateLimitInfo.isLoggedIn &&
                          rateLimitInfo.allowed ? (
                          <>
                            {rateLimitInfo.remaining} of {rateLimitInfo.limit}{' '}
                            generations remaining.{' '}
                            <Link
                              href="/auth/signin"
                              className="text-purple-300 hover:text-purple-200 underline transition-colors duration-200"
                            >
                              Sign in
                            </Link>{' '}
                            to get more generations per day.
                          </>
                        ) : (
                          getRateLimitMessage(rateLimitInfo)
                        )}
                        {!rateLimitInfo.allowed && timeUntilReset > 0 && (
                          <span className="text-orange-300/60 ml-1">
                            Reset in {formatTimeUntilReset(timeUntilReset)}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 px-6 pb-3 pt-1">
                    <div className="flex items-center justify-center gap-2 text-xs text-white/30">
                      <div className="w-1 h-1 rounded-full bg-white/20"></div>
                      <span className="text-xs">Loading rate limit...</span>
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
