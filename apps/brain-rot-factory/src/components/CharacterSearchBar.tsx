'use client'

import { Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

interface CharacterSearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  className?: string
}

export default function CharacterSearchBar({
  searchQuery,
  onSearchChange,
  className = '',
}: CharacterSearchBarProps) {
  const t = useTranslations('Characters')
  const [isFocused, setIsFocused] = useState(false)

  const handleClear = () => {
    onSearchChange('')
  }

  return (
    <div className={`mb-6 ${className}`}>
      <div className="max-w-xl mx-auto">
        {/* Ultra-subtle glassy water container - same style as ChatInput textarea */}
        <div className="relative group">
          {/* Main glassy container - barely visible, water-like */}
          <div
            className={`relative bg-white/3 backdrop-blur-xl rounded-2xl border border-white/5 ${isFocused ? 'border-white/8 bg-white/5' : ''} transition-all duration-500 shadow-lg ${isFocused ? 'shadow-white/5' : ''} overflow-hidden flex`}
          >
            {/* Minimal glass shine - like water surface */}
            <div
              className={`absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent ${isFocused ? 'opacity-60' : 'opacity-40'} transition-opacity duration-500 pointer-events-none rounded-2xl`}
            ></div>

            {/* Very subtle highlight */}
            <div
              className={`absolute top-1 left-2 w-6 h-6 bg-white/8 rounded-full blur-md ${isFocused ? 'bg-white/12' : ''} transition-all duration-500 pointer-events-none`}
            ></div>

            {/* Search icon */}
            <div className="flex items-center justify-center w-12">
              <Search
                className={`w-4 h-4 relative z-10 transition-colors duration-300 ${isFocused ? 'text-white/70' : 'text-white/50'}`}
              />
            </div>

            {/* Search input - almost invisible, merging with background */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`relative z-10 flex-1 h-10 pr-2 py-2 bg-transparent ${isFocused ? 'text-white' : 'text-white/90'} placeholder-white/30 focus:outline-none transition-colors duration-300 text-sm`}
              placeholder={t('searchPlaceholder')}
              autoComplete="off"
              spellCheck="false"
              autoCorrect="off"
              autoCapitalize="off"
            />

            {/* Clear button - only show when there's text */}
            {searchQuery && (
              <>
                {/* Ultra-subtle separator - like water ripple */}
                <div
                  className={`relative w-px h-6 bg-gradient-to-b from-transparent via-white/10 to-transparent ${isFocused ? 'opacity-70' : 'opacity-50'} transition-opacity duration-500 mx-1`}
                ></div>

                {/* Clear button - seamlessly integrated, glass-like */}
                <button
                  type="button"
                  onClick={handleClear}
                  className="relative flex items-center justify-center w-10 h-10 bg-transparent hover:bg-white/5 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-0 group/clear"
                  title="Clear search"
                >
                  {/* Minimal hover effect - like water disturbance */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/3 via-transparent to-transparent opacity-0 group-hover/clear:opacity-100 transition-opacity duration-300 rounded-r-2xl"></div>

                  {/* Icon - very subtle, water-like */}
                  <X className="w-4 h-4 text-white/50 relative z-10 group-hover/clear:text-white/80 group-hover/clear:scale-105 transition-all duration-300" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
