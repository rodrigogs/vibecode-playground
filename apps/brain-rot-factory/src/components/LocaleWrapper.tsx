'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface LocaleWrapperProps {
  children: React.ReactNode
  fallbackLocale?: string
}

export default function LocaleWrapper({
  children,
  fallbackLocale = 'en',
}: LocaleWrapperProps) {
  const params = useParams()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // During hydration, use fallback locale to prevent mismatch
  const locale = mounted
    ? (params.locale as string) || fallbackLocale
    : fallbackLocale

  useEffect(() => {
    // Update document lang attribute after mount to prevent hydration mismatch
    if (mounted && typeof document !== 'undefined') {
      document.documentElement.lang = locale
    }
  }, [locale, mounted])

  return <>{children}</>
}
