'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

interface NavigationLink {
  href: string
  label: string
}

interface PageNavigationProps {
  rightLinks?: NavigationLink[]
}

export default function PageNavigation({
  rightLinks = [],
}: PageNavigationProps) {
  const router = useRouter()
  const tCommon = useTranslations('common')
  const [canGoBack, setCanGoBack] = useState(false)

  useEffect(() => {
    // Check if there's history and if the previous page is within our domain
    const checkHistory = () => {
      const hasHistory = window.history.length > 1
      const referrer = document.referrer
      const currentDomain = window.location.origin

      // If there's history and the referrer is from our domain, we can use router.back()
      const hasValidBackDestination =
        hasHistory &&
        (!referrer || // If there's no referrer, assume we can go back
          referrer.startsWith(currentDomain)) // Or if the referrer is from our domain

      setCanGoBack(hasValidBackDestination)
    }

    checkHistory()
  }, [])

  const handleBack = () => {
    if (canGoBack) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        {/* Back button - always on the left */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {tCommon('back')}
        </button>

        {/* Right links - always on the right */}
        {rightLinks.length > 0 && (
          <div className="flex items-center gap-4">
            {rightLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors duration-200"
              >
                {link.label}
                <ArrowRight className="w-4 h-4" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
