'use client'

import { ChevronDown, Star, User, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

interface CharacterFiltersProps {
  popularityFilter: string
  onPopularityFilterChange: (filter: string) => void
  countryFilter: string
  onCountryFilterChange: (filter: string) => void
  genderFilter: string
  onGenderFilterChange: (filter: string) => void
  className?: string
}

export default function CharacterFilters({
  popularityFilter,
  onPopularityFilterChange,
  countryFilter,
  onCountryFilterChange,
  genderFilter,
  onGenderFilterChange,
  className = '',
}: CharacterFiltersProps) {
  const t = useTranslations('Characters.filters')
  const [showPopularityDropdown, setShowPopularityDropdown] = useState(false)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [showGenderDropdown, setShowGenderDropdown] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const popularityOptions = [
    {
      value: 'all',
      label: t('popularity.all'),
      description: t('popularity.allDescription'),
    },
    {
      value: 'top-5',
      label: t('popularity.top-5'),
      description: t('popularity.top-5Description'),
    },
    {
      value: 'well-known',
      label: t('popularity.well-known'),
      description: t('popularity.well-knownDescription'),
    },
    {
      value: 'decently-known',
      label: t('popularity.decently-known'),
      description: t('popularity.decently-knownDescription'),
    },
    {
      value: 'unknown',
      label: t('popularity.unknown'),
      description: t('popularity.unknownDescription'),
    },
  ]

  const genderOptions = [
    {
      value: 'all',
      label: t('gender.all'),
      description: t('gender.allDescription'),
    },
    {
      value: 'male',
      label: t('gender.male'),
      description: t('gender.maleDescription'),
    },
    {
      value: 'female',
      label: t('gender.female'),
      description: t('gender.femaleDescription'),
    },
  ]

  const countryOptions = [
    {
      code: 'all',
      name: t('country.all'),
      flag: '🌍',
      description: t('country.allDescription'),
    },
    {
      code: 'Italy',
      name: 'Italy',
      flag: '🇮🇹',
      description: 'Italian characters',
    },
    {
      code: 'Indonesia',
      name: 'Indonesia',
      flag: '🇮🇩',
      description: 'Indonesian characters',
    },
    {
      code: 'Spain',
      name: 'Spain',
      flag: '🇪🇸',
      description: 'Spanish characters',
    },
    {
      code: 'Japan',
      name: 'Japan',
      flag: '🇯🇵',
      description: 'Japanese characters',
    },
    {
      code: 'Vietnam',
      name: 'Vietnam',
      flag: '🇻🇳',
      description: 'Vietnamese characters',
    },
    {
      code: 'United States',
      name: 'United States',
      flag: '🇺🇸',
      description: 'American characters',
    },
    {
      code: 'Brazil',
      name: 'Brazil',
      flag: '🇧🇷',
      description: 'Brazilian characters',
    },
    {
      code: 'United Kingdom',
      name: 'United Kingdom',
      flag: '🇬🇧',
      description: 'British characters',
    },
    {
      code: 'Switzerland',
      name: 'Switzerland',
      flag: '🇨🇭',
      description: 'Swiss characters',
    },
    {
      code: 'Portugal',
      name: 'Portugal',
      flag: '🇵🇹',
      description: 'Portuguese characters',
    },
    {
      code: 'Philippines',
      name: 'Philippines',
      flag: '🇵🇭',
      description: 'Filipino characters',
    },
    {
      code: 'Australia',
      name: 'Australia',
      flag: '🇦🇺',
      description: 'Australian characters',
    },
    {
      code: 'Turkey',
      name: 'Turkey',
      flag: '🇹🇷',
      description: 'Turkish characters',
    },
    {
      code: 'Sweden',
      name: 'Sweden',
      flag: '🇸🇪',
      description: 'Swedish characters',
    },
    {
      code: 'Saudi Arabia',
      name: 'Saudi Arabia',
      flag: '🇸🇦',
      description: 'Saudi characters',
    },
    {
      code: 'Romania',
      name: 'Romania',
      flag: '🇷🇴',
      description: 'Romanian characters',
    },
    {
      code: 'Mexico',
      name: 'Mexico',
      flag: '🇲🇽',
      description: 'Mexican characters',
    },
    {
      code: 'Jordan',
      name: 'Jordan',
      flag: '🇯🇴',
      description: 'Jordanian characters',
    },
    {
      code: 'Israel',
      name: 'Israel',
      flag: '🇮🇱',
      description: 'Israeli characters',
    },
    {
      code: 'Iceland',
      name: 'Iceland',
      flag: '🇮🇸',
      description: 'Icelandic characters',
    },
    {
      code: 'Estonia',
      name: 'Estonia',
      flag: '🇪🇪',
      description: 'Estonian characters',
    },
    {
      code: 'Croatia',
      name: 'Croatia',
      flag: '🇭🇷',
      description: 'Croatian characters',
    },
    {
      code: 'China',
      name: 'China',
      flag: '🇨🇳',
      description: 'Chinese characters',
    },
    {
      code: 'Chile',
      name: 'Chile',
      flag: '🇨🇱',
      description: 'Chilean characters',
    },
    {
      code: 'Argentina',
      name: 'Argentina',
      flag: '🇦🇷',
      description: 'Argentinian characters',
    },
  ]

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowPopularityDropdown(false)
        setShowCountryDropdown(false)
        setShowGenderDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const getPopularityLabel = () => {
    const option = popularityOptions.find(
      (opt) => opt.value === popularityFilter,
    )
    return option ? option.label : t('popularity.all')
  }

  const getCountryLabel = () => {
    const option = countryOptions.find((opt) => opt.code === countryFilter)
    return option ? option.name : t('country.all')
  }

  const getCountryFlag = () => {
    const option = countryOptions.find((opt) => opt.code === countryFilter)
    return option ? option.flag : '🌍'
  }

  const getGenderLabel = () => {
    const option = genderOptions.find((opt) => opt.value === genderFilter)
    return option ? option.label : t('gender.all')
  }

  const hasActiveFilters =
    popularityFilter !== 'all' ||
    countryFilter !== 'all' ||
    genderFilter !== 'all'

  const clearAllFilters = () => {
    onPopularityFilterChange('all')
    onCountryFilterChange('all')
    onGenderFilterChange('all')
  }

  return (
    <div className={`${className}`} ref={containerRef}>
      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Popularity Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowPopularityDropdown(!showPopularityDropdown)
              setShowCountryDropdown(false)
              setShowGenderDropdown(false)
            }}
            className={`flex items-center gap-2 px-3 py-2 bg-white/5 backdrop-blur-sm border rounded-lg transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:bg-white/8 hover:border-purple-400/50 ${
              popularityFilter !== 'all'
                ? 'border-purple-400/70 bg-purple-500/20 shadow-lg shadow-purple-500/25'
                : 'border-white/20 hover:border-white/30'
            }`}
          >
            <Star className="w-3 h-3 text-purple-400" />
            <div className="flex flex-col items-start">
              <span className="text-xs font-medium text-white">
                {t('popularity.label')}
              </span>
              <span className="text-xs text-white/60">
                {getPopularityLabel()}
              </span>
            </div>
            <ChevronDown
              className={`w-3 h-3 text-white/60 transition-transform duration-200 ${showPopularityDropdown ? 'rotate-180' : ''}`}
            />
            {popularityFilter !== 'all' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full border-2 border-purple-900"></div>
            )}
          </button>

          {/* Popularity Dropdown */}
          {showPopularityDropdown && (
            <div className="absolute top-full mt-2 left-0 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-2 min-w-72 z-50 shadow-2xl">
              {popularityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onPopularityFilterChange(option.value)
                    setShowPopularityDropdown(false)
                  }}
                  className={`flex flex-col items-start w-full text-left px-4 py-3 text-sm rounded-lg hover:bg-white/10 transition-colors duration-200 ${
                    popularityFilter === option.value
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-white/50 mt-1">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Country Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowCountryDropdown(!showCountryDropdown)
              setShowPopularityDropdown(false)
              setShowGenderDropdown(false)
            }}
            className={`flex items-center gap-2 px-3 py-2 bg-white/5 backdrop-blur-sm border rounded-lg transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:bg-white/8 hover:border-purple-400/50 ${
              countryFilter !== 'all'
                ? 'border-purple-400/70 bg-purple-500/20 shadow-lg shadow-purple-500/25'
                : 'border-white/20 hover:border-white/30'
            }`}
          >
            <span className="text-sm">{getCountryFlag()}</span>
            <div className="flex flex-col items-start">
              <span className="text-xs font-medium text-white">
                {t('country.label')}
              </span>
              <span className="text-xs text-white/60">{getCountryLabel()}</span>
            </div>
            <ChevronDown
              className={`w-3 h-3 text-white/60 transition-transform duration-200 ${showCountryDropdown ? 'rotate-180' : ''}`}
            />
            {countryFilter !== 'all' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full border-2 border-purple-900"></div>
            )}
          </button>

          {/* Country Dropdown */}
          {showCountryDropdown && (
            <div className="absolute top-full mt-2 left-0 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-2 min-w-80 max-h-80 overflow-y-auto z-50 shadow-2xl">
              {countryOptions.map((option) => (
                <button
                  key={option.code}
                  onClick={() => {
                    onCountryFilterChange(option.code)
                    setShowCountryDropdown(false)
                  }}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3 text-sm rounded-lg hover:bg-white/10 transition-colors duration-200 ${
                    countryFilter === option.code
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{option.flag}</span>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{option.name}</span>
                    <span className="text-xs text-white/50">
                      {option.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Gender Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowGenderDropdown(!showGenderDropdown)
              setShowPopularityDropdown(false)
              setShowCountryDropdown(false)
            }}
            className={`flex items-center gap-2 px-3 py-2 bg-white/5 backdrop-blur-sm border rounded-lg transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:bg-white/8 hover:border-purple-400/50 ${
              genderFilter !== 'all'
                ? 'border-purple-400/70 bg-purple-500/20 shadow-lg shadow-purple-500/25'
                : 'border-white/20 hover:border-white/30'
            }`}
          >
            <User className="w-3 h-3 text-purple-400" />
            <div className="flex flex-col items-start">
              <span className="text-xs font-medium text-white">
                {t('gender.label')}
              </span>
              <span className="text-xs text-white/60">{getGenderLabel()}</span>
            </div>
            <ChevronDown
              className={`w-3 h-3 text-white/60 transition-transform duration-200 ${showGenderDropdown ? 'rotate-180' : ''}`}
            />
            {genderFilter !== 'all' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full border-2 border-purple-900"></div>
            )}
          </button>

          {/* Gender Dropdown */}
          {showGenderDropdown && (
            <div className="absolute top-full mt-2 left-0 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-2 min-w-64 z-50 shadow-2xl">
              {genderOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onGenderFilterChange(option.value)
                    setShowGenderDropdown(false)
                  }}
                  className={`flex flex-col items-start w-full text-left px-4 py-3 text-sm rounded-lg hover:bg-white/10 transition-colors duration-200 ${
                    genderFilter === option.value
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-white/50 mt-1">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clear All Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="flex items-center justify-center w-9 h-9 bg-red-500/20 border border-red-400/50 text-red-300 rounded-lg hover:bg-red-500/30 hover:border-red-400/70 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/50"
            title={t('clearFilters')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
