import type { Country, Language } from '../types/character.js'

/**
 * Map country names to ISO 639-1 language codes
 */
const COUNTRY_TO_LANGUAGE: Record<Country, Language> = {
  // Main countries
  'Italy': 'it',
  'Indonesia': 'id',
  'Netherlands': 'nl',
  'Spain': 'es',
  'Mexico': 'es',
  'United States': 'en',
  'Vietnam': 'vi',
  'Saudi Arabia': 'ar',
  'Brazil': 'pt',
  'Romania': 'ro',
  'United Kingdom': 'en',
  'Sweden': 'sv',
  'Switzerland': 'de', // Assuming German as primary
  'Albania': 'unknown', // Albanian not in our Language type
  'Iceland': 'is',
  'Esperanto': 'eo',
  'Portugal': 'pt',
  'China': 'zh',
  'Israel': 'he',
  'Chile': 'es',
  'Australia': 'en',
  'France': 'fr',
  'Russia': 'ru',
  'Japan': 'ja',
  'Turkey': 'tr',
  'Croatia': 'hr',
  'Venezuela': 'es',
  'Jordan': 'ar',
  'Bemba': 'unknown', // African language not in our Language type
  'Hausa': 'unknown', // African language not in our Language type
  'Philippines': 'tl', // Filipino/Tagalog
  'Argentina': 'es',
  'Basque': 'unknown', // Basque not in our Language type
  'Waray': 'unknown', // Philippine language not in our Language type
  'Cebuano': 'unknown', // Philippine language not in our Language type
  'Berber': 'unknown', // North African language not in our Language type
  'Kampampangan': 'unknown', // Philippine language not in our Language type
  'Kanuri': 'unknown', // African language not in our Language type
  'Kaixana': 'unknown', // Brazilian indigenous language not in our Language type
  'Pakistan': 'unknown', // Urdu not in our Language type
  'Poland': 'pl',
  'Malaysia': 'ms',
  'Unknown': 'unknown',
}

/**
 * Get language code from a list of countries
 * Returns the language of the first country in the list
 */
export function getLanguageFromCountries(countries: Country[]): Language {
  if (!countries.length) {
    return 'unknown' // Default to unknown
  }

  const firstCountry = countries[0]
  if (!firstCountry) {
    return 'unknown'
  }

  return COUNTRY_TO_LANGUAGE[firstCountry] || 'unknown' // Default to unknown if country not found
}
