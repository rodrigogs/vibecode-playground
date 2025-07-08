import type { BrainRotCharacter } from '@/types/characters'

export function filterCharacters(
  characters: BrainRotCharacter[],
  searchQuery: string,
  popularityFilter: string,
  countryFilter: string,
  genderFilter: string,
): BrainRotCharacter[] {
  return characters.filter((character) => {
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
}
