import type { BrainRotCharacter } from '@/types/characters'

/**
 * Sort characters by popularity priority: top-5 > well-known > decently-known > unknown
 */
function sortCharactersByPopularity(
  characters: BrainRotCharacter[],
): BrainRotCharacter[] {
  const popularityOrder = {
    'top-5': 1,
    'well-known': 2,
    'decently-known': 3,
    'unknown': 4,
  } as const

  return characters.sort((a, b) => {
    const aPopularity = a.popularity || 'unknown'
    const bPopularity = b.popularity || 'unknown'

    const aOrder =
      popularityOrder[aPopularity as keyof typeof popularityOrder] || 4
    const bOrder =
      popularityOrder[bPopularity as keyof typeof popularityOrder] || 4

    // Primary sort by popularity
    if (aOrder !== bOrder) {
      return aOrder - bOrder
    }

    // Secondary sort by name for consistent ordering within same popularity level
    return (a.name || '').localeCompare(b.name || '')
  })
}

export function filterCharacters(
  characters: BrainRotCharacter[],
  searchQuery: string,
  popularityFilter: string,
  countryFilter: string,
  genderFilter: string,
): BrainRotCharacter[] {
  const filtered = characters.filter((character) => {
    // Text search filter - search in name and description only
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !query ||
      (character.name && character.name.toLowerCase().includes(query)) ||
      (character.description &&
        character.description.toLowerCase().includes(query))

    // Popularity filter
    const matchesPopularity =
      popularityFilter === 'all' ||
      (character.popularity && character.popularity === popularityFilter)

    // Country filter
    const matchesCountry =
      countryFilter === 'all' ||
      (character.country && character.country === countryFilter)

    // Gender filter
    const matchesGender =
      genderFilter === 'all' ||
      (character.gender && character.gender === genderFilter)

    return matchesSearch && matchesPopularity && matchesCountry && matchesGender
  })

  // Sort the filtered characters by popularity priority
  return sortCharactersByPopularity(filtered)
}
