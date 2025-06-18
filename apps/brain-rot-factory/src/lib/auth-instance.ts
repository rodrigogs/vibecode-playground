import NextAuth from 'next-auth'

import { authConfig } from '@/lib/auth'

export const { auth, signIn, signOut, handlers } = NextAuth(authConfig)
