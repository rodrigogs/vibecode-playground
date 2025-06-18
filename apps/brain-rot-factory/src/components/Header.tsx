import Image from 'next/image'

import AuthButton from '@/components/AuthButton'

export default function Header() {
  return (
    <header className="py-6">
      {/* Main Header Content */}
      <div className="max-w-6xl mx-auto">
        {/* Title and Auth Button Container */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12">
          {/* Hidden spacer for desktop to center the title */}
          <div className="hidden lg:block lg:w-32"></div>

          {/* Title Section - Always centered */}
          <div className="text-center flex-1">
            <div className="relative flex items-center justify-center mb-4 lg:mb-0">
              <Image
                src="/images/logo.png"
                alt="Brain Rot Factory Logo"
                width={150}
                height={150}
                className="absolute opacity-80 z-0"
                unoptimized
              />
              <h1
                className="relative z-10 text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent leading-normal"
                style={{
                  filter: 'drop-shadow(0 4px 6px rgba(168, 85, 247, 0.4))',
                }}
              >
                Brain Rot Factory
              </h1>
            </div>
          </div>

          {/* Auth Button - Right on desktop, center on mobile */}
          <div className="flex justify-center lg:justify-end lg:w-32 lg:pr-2">
            <AuthButton />
          </div>
        </div>

        {/* Description */}
        <div className="text-center">
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Select a character below to start chatting with AI-powered Italian
            brain rot personalities!
          </p>
        </div>
      </div>
    </header>
  )
}
