'use client'

import { useCallback, useState } from 'react'

import type { BrainRotCharacter } from '@/types/characters'

export interface UseCharacterSelectionReturn {
  selectedCharacter: BrainRotCharacter | null
  selectCharacter: (character: BrainRotCharacter) => void
  clearSelection: () => void
}

export function useCharacterSelection(): UseCharacterSelectionReturn {
  const [selectedCharacter, setSelectedCharacter] =
    useState<BrainRotCharacter | null>(null)

  // Handle character selection with session management
  const selectCharacter = useCallback((character: BrainRotCharacter) => {
    setSelectedCharacter(character)

    // Smooth scroll to header separator after a brief delay to ensure the UI is updated
    setTimeout(() => {
      const headerSeparator = document.getElementById('header-separator')
      if (headerSeparator) {
        headerSeparator.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
    }, 100)
  }, [])

  // Clear character selection
  const clearSelection = useCallback(() => {
    setSelectedCharacter(null)
  }, [])

  return {
    selectedCharacter,
    selectCharacter,
    clearSelection,
  }
}
