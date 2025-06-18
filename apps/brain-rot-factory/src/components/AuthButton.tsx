'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'

export default function AuthButton() {
  const { data: session, status } = useSession()

  // Helper function to get user initials
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (status === 'loading') {
    return (
      <div className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-full animate-pulse border border-white/10 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-full"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <Link
        href="/auth/signin"
        className="group w-12 h-12 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-purple-500/40 border border-white/10 hover:border-white/20 relative overflow-hidden"
        title="Sign in with GitHub"
      >
        {/* Glass shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300 rounded-full"></div>
        <div className="absolute top-0 left-0 w-6 h-6 bg-white/20 rounded-full blur-sm transform -translate-x-1 -translate-y-1 group-hover:scale-110 transition-transform duration-300"></div>

        {/* Login icon */}
        <svg
          className="w-5 h-5 text-white/90 relative z-10 group-hover:text-white group-hover:scale-110 transition-all duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
          />
        </svg>
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      className="group w-12 h-12 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-purple-600/10 hover:from-purple-500/20 hover:via-pink-500/10 hover:to-purple-600/20 backdrop-blur-md rounded-full flex items-center justify-center text-white/90 hover:text-white font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-purple-500/60 border border-purple-400/20 hover:border-purple-400/40 relative overflow-hidden"
      title={`${session.user?.name || 'User'} - Click to sign out`}
    >
      {/* Liquid glass shine effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-purple-300/10 to-pink-300/5 opacity-70 group-hover:opacity-90 transition-opacity duration-300 rounded-full"></div>
      <div className="absolute top-1 left-1 w-4 h-4 bg-white/25 rounded-full blur-sm group-hover:scale-125 group-hover:bg-white/35 transition-all duration-300"></div>
      <div className="absolute bottom-2 right-2 w-2 h-2 bg-purple-300/30 rounded-full blur-[1px] group-hover:bg-purple-300/50 transition-colors duration-300"></div>

      <span className="relative z-10 group-hover:scale-110 transition-all duration-300">
        {getInitials(session.user?.name)}
      </span>
    </button>
  )
}
