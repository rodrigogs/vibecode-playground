import type { PopularityLevel } from '../types/character.js'
import type { PopularityImageElement } from '../types/popularity.js'

export const resolvePopularity = (
  popularityImage: unknown,
): PopularityLevel => {
  // If no image element is provided, return 'unknown' (no stars)
  if (!popularityImage) return 'unknown'

  // Check if the popularityImage has the attr method
  const imageElement = popularityImage as PopularityImageElement
  if (typeof imageElement.attr !== 'function') return 'unknown'

  const starSrc = imageElement.attr('src')
  if (!starSrc) return 'unknown'

  // Extract filename from URL (handles both thumbnail and direct URLs)
  const filename = starSrc.split('/').pop() || ''

  // Map star images to popularity levels based on the provided HTML structure
  // Star-dk.png - decently known or a bit popular
  if (filename.includes('Star-dk.png')) return 'decently-known'

  // Star-wk.png - well known or popular
  if (filename.includes('Star-wk.png')) return 'well-known'

  // Star-top5.png - very known that it is at the top 5
  if (filename.includes('Star-top5.png')) return 'top-5'

  // Default to 'unknown' - unknown or not popular
  return 'unknown'
}
