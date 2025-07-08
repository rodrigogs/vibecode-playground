'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        {/* Back button - sempre à esquerda */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        {/* Right links - sempre à direita */}
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
