import * as cheerio from 'cheerio'

import { buildAxiosAgent } from '../http/agent.js'
import { resolveCountry } from '../parsers/country-resolver.js'
import { resolveOther } from '../parsers/other-resolver.js'
import { resolvePopularity } from '../parsers/popularity-resolver.js'
import type {
  CharacterListItem,
  Country,
  Other,
  PopularityLevel,
} from '../types/index.js'
import { extractOriginalImageUrl } from './image-scraper.js'

export const charactersList = async (): Promise<CharacterListItem[]> => {
  console.log('Attempting to fetch character list...')

  const agent = buildAxiosAgent()

  const response = await agent.get(
    'https://italianbrainrot.miraheze.org/wiki/List_of_characters',
  )

  console.log('Successfully fetched the page!')
  console.log('Response status:', response.status)

  const $ = cheerio.load(response.data)

  const sections = $(
    '#mw-content-text > div.mw-content-ltr.mw-parser-output > ul',
  )

  const [, , , ...characterSections] = sections.toArray() // Skip flags, popularity and other sections

  const list = characterSections
    .map((section) => $(section).find('li').toArray())
    .flat()

  console.log(`Found ${list.length} character entries`)

  const characters = await Promise.all(
    list.map(async (item) => {
      const $item = $(item)
      const name = $item.find('> a').text()
      const relativeUrl = $item.find('> a').attr('href')

      // Get all images
      const images = $item.find('img').toArray()
      const countries: Country[] = []
      const other: Other[] = []
      let popularity: PopularityLevel = 'unknown'
      let mainImageUrl: string | undefined

      // Extract main character image URL from the first image
      if (images.length > 0) {
        const firstImage = $(images[0])
        const mainImageRelativeUrl = firstImage.closest('a').attr('href')

        if (mainImageRelativeUrl) {
          const fullImagePageUrl = `https://italianbrainrot.miraheze.org${mainImageRelativeUrl}`
          mainImageUrl = await extractOriginalImageUrl(fullImagePageUrl)
        }
      }

      // Skip first image (character image) and process the rest
      // Try each resolver on each image
      for (let i = 1; i < images.length; i++) {
        const $image = $(images[i])

        // Try popularity resolver (only set if not already set)
        if (popularity === 'unknown') {
          const resolvedPopularity = resolvePopularity($image)
          if (resolvedPopularity !== 'unknown') {
            popularity = resolvedPopularity
            continue
          }
        }

        // Try other resolver
        const resolvedOther = resolveOther($image)
        if (resolvedOther) {
          other.push(resolvedOther)
          continue
        }

        // Try country resolver
        const resolvedCountry = resolveCountry($image)
        if (resolvedCountry) {
          countries.push(resolvedCountry)
        }
      }

      // If no countries found, default to Unknown
      if (countries.length === 0) {
        countries.push('Unknown')
      }

      return {
        name,
        relativeUrl,
        mainImageUrl,
        countries,
        popularity,
        other,
      }
    }),
  )

  return characters
}
