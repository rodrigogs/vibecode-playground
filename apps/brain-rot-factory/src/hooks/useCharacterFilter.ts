'use client'

import { useCallback, useEffect, useState } from 'react'

import { filterCharacters } from '@/lib/characterFilter'
import type { BrainRotCharacter } from '@/types/characters'

export interface UseCharacterFilterReturn {
  // State
  searchQuery: string
  popularityFilter: string
  countryFilter: string
  genderFilter: string
  visibleCount: number
  isLoadingMore: boolean
  // Computed values
  filteredCharacters: BrainRotCharacter[]
  displayedCharacters: BrainRotCharacter[]
  hasMoreCharacters: boolean
  // Actions
  setSearchQuery: (query: string) => void
  setPopularityFilter: (filter: string) => void
  setCountryFilter: (filter: string) => void
  setGenderFilter: (filter: string) => void
  loadMoreCharacters: () => void
}

interface UseCharacterFilterProps {
  characters: BrainRotCharacter[]
  initialDisplayCount?: number
  loadMoreCount?: number
}

export function useCharacterFilter({
  characters,
  initialDisplayCount = 12,
  loadMoreCount = 12,
}: UseCharacterFilterProps): UseCharacterFilterReturn {
  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [popularityFilter, setPopularityFilter] = useState<string>('all')
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const [visibleCount, setVisibleCount] = useState<number>(initialDisplayCount)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)

  // Filter characters based on search query and filters
  const filteredCharacters = filterCharacters(
    characters,
    searchQuery,
    popularityFilter,
    countryFilter,
    genderFilter,
  )

  // Show only the visible count of characters (seamless pagination)
  const displayedCharacters = filteredCharacters.slice(0, visibleCount)
  const hasMoreCharacters = filteredCharacters.length > visibleCount

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(initialDisplayCount)
  }, [
    searchQuery,
    popularityFilter,
    countryFilter,
    genderFilter,
    initialDisplayCount,
  ])

  // Load more characters smoothly
  const loadMoreCharacters = useCallback(() => {
    if (hasMoreCharacters && !isLoadingMore) {
      setIsLoadingMore(true)
      // Simulate a small delay for smooth UX
      setTimeout(() => {
        setVisibleCount((prev) =>
          Math.min(prev + loadMoreCount, filteredCharacters.length),
        )
        setIsLoadingMore(false)
      }, 300)
    }
  }, [
    hasMoreCharacters,
    isLoadingMore,
    filteredCharacters.length,
    loadMoreCount,
  ])

  return {
    // State
    searchQuery,
    popularityFilter,
    countryFilter,
    genderFilter,
    visibleCount,
    isLoadingMore,
    // Computed values
    filteredCharacters,
    displayedCharacters,
    hasMoreCharacters,
    // Actions
    setSearchQuery,
    setPopularityFilter,
    setCountryFilter,
    setGenderFilter,
    loadMoreCharacters,
  }
}
