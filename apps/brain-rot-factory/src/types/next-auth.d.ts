import type { DefaultSession, DefaultUser } from 'next-auth'
import type { DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface User extends DefaultUser {
    id: string
  }

  interface Session extends DefaultSession {
    user: User
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
  }
}
