export type Country =
  | 'Italy'
  | 'Indonesia'
  | 'Netherlands'
  | 'Spain'
  | 'Mexico'
  | 'United States'
  | 'Vietnam'
  | 'Saudi Arabia'
  | 'Brazil'
  | 'Romania'
  | 'United Kingdom'
  | 'Sweden'
  | 'Switzerland'
  | 'Albania'
  | 'Iceland'
  | 'Esperanto'
  | 'Portugal'
  | 'China'
  | 'Israel'
  | 'Chile'
  | 'Australia'
  | 'France'
  | 'Russia'
  | 'Japan'
  | 'Turkey'
  | 'Croatia'
  | 'Venezuela'
  | 'Jordan'
  | 'Bemba'
  | 'Hausa'
  | 'Philippines'
  | 'Argentina'
  | 'Basque'
  | 'Waray'
  | 'Cebuano'
  | 'Berber'
  | 'Kampampangan'
  | 'Kanuri'
  | 'Kaixana'
  | 'Pakistan'
  | 'Poland'
  | 'Malaysia'
  | 'Unknown'

export type Other = 'made-by-staff' | 'lost-media'

// Popularity levels based on the example data
export type PopularityLevel =
  | 'unknown'
  | 'decently-known'
  | 'well-known'
  | 'top-5'

export interface CharacterListItem {
  name: string
  relativeUrl: string | undefined
  mainImageUrl: string | undefined
  popularity: PopularityLevel
  other: Other[]
  countries: Country[]
}

export interface CharacterInfo {
  name: string
  countries: Country[]
  popularity: PopularityLevel
  other: Other[]
  url: string
  imageUrls?: string[]
  context?: string
}

// Voice types for character voices
export type Voice =
  | 'alloy'
  | 'ash'
  | 'ballad'
  | 'coral'
  | 'echo'
  | 'fable'
  | 'nova'
  | 'onyx'
  | 'sage'
  | 'shimmer'
  | 'verse'

// Language codes
export type Language =
  | 'it' // Italian
  | 'id' // Indonesian
  | 'en' // English
  | 'es' // Spanish
  | 'fr' // French
  | 'de' // German
  | 'pt' // Portuguese
  | 'nl' // Dutch
  | 'tr' // Turkish
  | 'hr' // Croatian
  | 'ro' // Romanian
  | 'sv' // Swedish
  | 'ar' // Arabic
  | 'zh' // Chinese
  | 'ja' // Japanese
  | 'he' // Hebrew
  | 'ru' // Russian
  | 'pl' // Polish
  | 'is' // Icelandic
  | 'eo' // Esperanto
  | 'tl' // Filipino/Tagalog
  | 'ms' // Malay
  | 'vi' // Vietnamese
  | 'unknown' // Defaults to Italian if not specified

// Gender types for character voices
export type Gender = 'male' | 'female'

/**
 * Complete Character type based on the brain-rot factory examples
 * This represents a fully enriched character with all available data
 */
export interface Character {
  /** Unique identifier for the character */
  id: string

  /** Display name of the character */
  name: string

  /** Short description of the character */
  description: string

  /** Character gender */
  gender: Gender

  /** Primary language of the character */
  language: Language

  /** Country/region of origin */
  country: Country

  /** Voice type for text-to-speech */
  voice: Voice

  /** Detailed background story */
  background: string

  /** Visual motifs and themes associated with the character */
  motifs: string[]

  /** Background music associated with the character */
  bgm: string

  /** Signature phrases and expressions */
  catchphrases: string[]

  /** Image filenames for the character */
  images: string[]

  /** Character popularity level */
  popularity: PopularityLevel

  /** Optional fields from crawler data */
  relativeUrl?: string
  mainImageUrl?: string
  other?: Other[]
  imageUrls?: string[]
  context?: string
}
