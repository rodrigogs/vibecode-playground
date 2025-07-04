import Image from 'next/image'
import { useTranslations } from 'next-intl'

import AuthButton from '@/components/AuthButton'
import LanguageSelector from '@/components/LanguageSelector'

export default function Header() {
  const t = useTranslations('Header')

  return (
    <header className="py-4">
      {/* Main Header Content */}
      <div className="max-w-6xl mx-auto">
        {/* Title and Auth Button Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center mb-8">
          {/* Logo Section - Left (3 columns on desktop) */}
          <div className="lg:col-span-3 flex justify-center lg:justify-start order-1">
            <a
              href="https://github.com/rodrigogs/vibecode-playground"
              target="_blank"
              rel="noopener noreferrer"
              title="View source code on GitHub"
            >
              <Image
                src="/images/logo.png"
                alt="Brain-rot Factory Logo"
                width={200}
                height={200}
                className="opacity-80 -my-6 hover:animation-paused cursor-pointer transition-all duration-300"
                style={{
                  filter: `
                    drop-shadow(0 0 12px rgba(0, 255, 0, 0.35))
                    drop-shadow(0 0 24px rgba(255, 0, 255, 0.25))
                    drop-shadow(0 0 36px rgba(0, 255, 255, 0.18))
                    drop-shadow(0 0 6px rgba(255, 255, 0, 0.4))
                    hue-rotate(60deg)
                    contrast(1.2)
                    brightness(1.08)
                    saturate(1.4)
                  `,
                  animation: 'spookyPulse 3s ease-in-out infinite alternate',
                }}
                unoptimized
              />
            </a>
          </div>

          {/* Title Section - Center (6 columns on desktop) */}
          <div className="lg:col-span-6 flex justify-center order-2 lg:order-2">
            <h1
              className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent leading-normal text-center"
              style={{
                filter: 'drop-shadow(0 4px 6px rgba(168, 85, 247, 0.4))',
              }}
            >
              {t('title')}
            </h1>
          </div>

          {/* Auth Button and Language Selector - Right (3 columns on desktop) */}
          <div className="lg:col-span-3 flex items-center gap-3 justify-center lg:justify-end order-3">
            <LanguageSelector />
            <AuthButton />
          </div>
        </div>

        {/* Small discrete separator between header and content below */}
        <div
          id="header-separator"
          className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50 mb-8"
        ></div>

        {/* Description */}
        <div className="text-center">
          <p className="text-sm text-gray-200 max-w-3xl mx-auto leading-relaxed font-medium">
            {t('subtitle')}
          </p>
        </div>
      </div>
    </header>
  )
}
