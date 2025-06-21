'use client'

import { Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useState } from 'react'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
]

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const locale = useLocale()
  const router = useRouter()

  const handleLanguageChange = (newLocale: string) => {
    const path = window.location.pathname
    const newPath = path.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPath)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:border-white/30 active:border-white/50 cursor-pointer ${
          isOpen ? 'border border-white/50' : 'border border-transparent'
        }`}
        title="Change language"
      >
        <Globe className="w-5 h-5 text-white/85 hover:text-white/95 transition-colors duration-200" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-black/70 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl min-w-[150px] z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/8 transition-colors first:rounded-t-2xl last:rounded-b-2xl cursor-pointer ${
                locale === language.code
                  ? 'bg-purple-500/15 text-purple-200'
                  : 'text-white/85'
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              <span className="text-sm font-medium">{language.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}
