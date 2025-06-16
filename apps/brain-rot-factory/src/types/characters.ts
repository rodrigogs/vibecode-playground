export interface BrainRotCharacter {
  id: string
  name: string
  description: string
  language: string
  image: string
  background: string
  motifs?: string[]
  bgm?: string
  catchphrases?: string[]
  disabled?: boolean
}

export interface CharacterData {
  characters: BrainRotCharacter[]
  metadata: {
    version: string
    totalCharacters: number
    lastUpdated: string
    source: string
    description: string
  }
}
