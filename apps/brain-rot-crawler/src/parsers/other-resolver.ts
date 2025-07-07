import type { Other } from '../types/character.js'
import type { OtherImageElement } from '../types/other.js'

export const resolveOther = (otherImage: unknown): Other | undefined => {
  // If no image element is provided, return undefined
  if (!otherImage) return undefined

  const starSrc = (otherImage as OtherImageElement).attr('src')
  if (!starSrc) return undefined

  // Extract filename from URL (handles both thumbnail and direct URLs)
  const filename = starSrc.split('/').pop() || ''

  // Map other star images to special categories based on the provided HTML structure
  // Star-staff.png - made by staff member
  if (filename.includes('Star-staff.png')) return 'made-by-staff'

  // Star_Lost.png - lost media
  if (filename.includes('Star_Lost.png')) return 'lost-media'

  // Return undefined if no matching other star is found
  return undefined
}
