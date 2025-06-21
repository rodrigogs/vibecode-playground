'use client'

import { LogIn, LogOut } from 'lucide-react'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

export default function AuthButton() {
  const { data: session, status } = useSession()
  const t = useTranslations('Auth')

  if (status === 'loading') {
    return (
      <div className="w-12 h-12 rounded-full border border-white/20 animate-pulse flex items-center justify-center">
        <div className="w-5 h-5 bg-white/20 rounded animate-pulse"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <Link
        href="/auth/signin"
        className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 border border-transparent hover:border-white/30 active:border-white/50 cursor-pointer"
        title={t('signIn')}
      >
        <LogIn className="w-5 h-5 text-white/85 hover:text-white/95 transition-colors duration-200" />
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 border border-transparent hover:border-white/30 active:border-white/50 cursor-pointer"
      title={`${session.user?.name || 'User'} - ${t('signOut')}`}
    >
      <LogOut className="w-5 h-5 text-white/85 hover:text-white/95 transition-colors duration-200" />
    </button>
  )
}
