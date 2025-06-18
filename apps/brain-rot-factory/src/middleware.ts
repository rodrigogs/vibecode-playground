import { auth } from '@/lib/auth-instance'

export default auth(() => {
  // The auth function will handle the authorization logic
  // based on the configuration in auth.ts
})

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
