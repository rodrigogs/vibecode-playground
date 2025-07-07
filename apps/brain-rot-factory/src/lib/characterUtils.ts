import type { BrainRotCharacter } from '@/types/characters'

/**
 * Gets the primary image for a character, handling both old and new image formats
 * @param character - The character object
 * @returns The primary image filename
 */
export function getCharacterImage(character: BrainRotCharacter): string {
  // New format: images array
  if (character.images && character.images.length > 0) {
    return character.images[0]
  }

  // Old format: single image string
  if (character.image) {
    return character.image
  }

  // Fallback to default image
  return 'exampli-examplini-0.webp'
}

/**
 * Gets all images for a character
 * @param character - The character object
 * @returns Array of image filenames
 */
export function getCharacterImages(character: BrainRotCharacter): string[] {
  // New format: images array
  if (character.images && character.images.length > 0) {
    return character.images
  }

  // Old format: single image string
  if (character.image) {
    return [character.image]
  }

  // Fallback to default image
  return ['exampli-examplini-0.webp']
}
