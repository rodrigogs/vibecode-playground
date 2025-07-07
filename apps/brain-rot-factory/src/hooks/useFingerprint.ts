'use client'

import { useEffect, useState } from 'react'

import { generateClientFingerprint } from '@/lib/client-fingerprint'

/**
 * Hook to generate and manage browser fingerprint
 */
export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const generateFingerprint = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Small delay to ensure DOM is ready
        await new Promise((resolve) => setTimeout(resolve, 100))

        const fp = await generateClientFingerprint()

        if (isMounted) {
          setFingerprint(fp)
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to generate fingerprint',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    generateFingerprint()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    fingerprint,
    isLoading,
    error,
  }
}
