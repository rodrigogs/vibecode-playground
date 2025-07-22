/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'

import { filterCharacters } from '@/lib/characterFilter'
import type { BrainRotCharacter } from '@/types/characters'

describe('Character Filter and Sorting', () => {
  const mockCharacters: BrainRotCharacter[] = [
    {
      id: '1',
      name: 'Unknown Character',
      description: 'An unknown character',
      popularity: 'unknown',
      country: 'Italy',
      gender: 'male',
      voice: 'onyx',
      language: 'it',
      motifs: [],
      images: [],
      background: '',
      disabled: false,
    },
    {
      id: '2',
      name: 'Top Character',
      description: 'A top-5 character',
      popularity: 'top-5',
      country: 'Italy',
      gender: 'female',
      voice: 'nova',
      language: 'it',
      motifs: [],
      images: [],
      background: '',
      disabled: false,
    },
    {
      id: '3',
      name: 'Well Known Character',
      description: 'A well-known character',
      popularity: 'well-known',
      country: 'Spain',
      gender: 'male',
      voice: 'alloy',
      language: 'es',
      motifs: [],
      images: [],
      background: '',
      disabled: false,
    },
    {
      id: '4',
      name: 'Decently Known Character',
      description: 'A decently-known character',
      popularity: 'decently-known',
      country: 'Brazil',
      gender: 'female',
      voice: 'echo',
      language: 'pt',
      motifs: [],
      images: [],
      background: '',
      disabled: false,
    },
    {
      id: '5',
      name: 'Another Top Character',
      description: 'Another top-5 character',
      popularity: 'top-5',
      country: 'Italy',
      gender: 'male',
      voice: 'sage',
      language: 'it',
      motifs: [],
      images: [],
      background: '',
      disabled: false,
    },
  ]

  it('should sort characters by popularity priority: top-5 > well-known > decently-known > unknown', () => {
    const filtered = filterCharacters(
      mockCharacters,
      '', // no search query
      'all', // all popularity
      'all', // all countries
      'all', // all genders
    )

    // Check the order of popularity levels
    const popularityOrder = filtered.map((char) => char.popularity)

    // Should start with top-5 characters
    expect(popularityOrder[0]).toBe('top-5')
    expect(popularityOrder[1]).toBe('top-5')

    // Then well-known
    expect(popularityOrder[2]).toBe('well-known')

    // Then decently-known
    expect(popularityOrder[3]).toBe('decently-known')

    // Finally unknown
    expect(popularityOrder[4]).toBe('unknown')
  })

  it('should sort characters alphabetically within the same popularity level', () => {
    const filtered = filterCharacters(
      mockCharacters,
      '', // no search query
      'all', // all popularity
      'all', // all countries
      'all', // all genders
    )

    // Find all top-5 characters
    const top5Characters = filtered.filter(
      (char) => char.popularity === 'top-5',
    )

    // They should be sorted alphabetically by name
    expect(top5Characters[0].name).toBe('Another Top Character')
    expect(top5Characters[1].name).toBe('Top Character')
  })

  it('should maintain sort order when filtering by popularity', () => {
    const filtered = filterCharacters(
      mockCharacters,
      '', // no search query
      'top-5', // only top-5 characters
      'all', // all countries
      'all', // all genders
    )

    // Should only return top-5 characters, sorted alphabetically
    expect(filtered.length).toBe(2)
    expect(filtered[0].name).toBe('Another Top Character')
    expect(filtered[1].name).toBe('Top Character')
  })

  it('should maintain sort order when filtering by other criteria', () => {
    const filtered = filterCharacters(
      mockCharacters,
      '', // no search query
      'all', // all popularity
      'Italy', // only Italian characters
      'all', // all genders
    )

    // Should return Italian characters sorted by popularity
    const italianCharacters = filtered.filter(
      (char) => char.country === 'Italy',
    )
    const popularityOrder = italianCharacters.map((char) => char.popularity)

    // Top-5 characters should come first
    expect(popularityOrder[0]).toBe('top-5')
    expect(popularityOrder[1]).toBe('top-5')
    expect(popularityOrder[2]).toBe('unknown')
  })

  it('should handle characters with missing popularity gracefully', () => {
    const charactersWithMissingPopularity: BrainRotCharacter[] = [
      {
        ...mockCharacters[0],
        popularity: undefined, // Missing popularity
      },
      ...mockCharacters.slice(1),
    ]

    const filtered = filterCharacters(
      charactersWithMissingPopularity,
      '', // no search query
      'all', // all popularity
      'all', // all countries
      'all', // all genders
    )

    // Should treat missing popularity as 'unknown' and place it at the end
    expect(filtered.length).toBe(5)
    expect(filtered[filtered.length - 1].id).toBe('1') // Character with missing popularity should be last
  })
})
