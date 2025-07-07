export interface BrainRotCharacter {
  id: string
  name: string
  description: string
  language: string
  voice?: string
  // Support both old format (single image) and new format (image array)
  image?: string
  images?: string[]
  background: string
  motifs?: string[]
  bgm?: string
  catchphrases?: string[]
  popularity?: string
  country?: string
  gender?: string
  disabled?: boolean
}
