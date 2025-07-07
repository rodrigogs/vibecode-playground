import * as cheerio from 'cheerio'

import { buildAxiosAgent } from '../http/agent.js'
import type { CharacterInfo, CharacterListItem } from '../types/index.js'

export const loadCharacterInfo = async (
  characterListItem: CharacterListItem,
): Promise<CharacterInfo> => {
  const agent = buildAxiosAgent()

  if (!characterListItem.relativeUrl) {
    throw new Error(`No URL available for character: ${characterListItem.name}`)
  }

  const fullUrl = `https://italianbrainrot.miraheze.org${characterListItem.relativeUrl}`

  console.log(`Loading character info for: ${characterListItem.name}`)

  const response = await agent.get(fullUrl)
  const $ = cheerio.load(response.data)

  // Use just the main image URL from the character list item
  const imageUrls = characterListItem.mainImageUrl
    ? [characterListItem.mainImageUrl]
    : []

  // Extract context/description from the page content
  const contentElement = $('#mw-content-text .mw-parser-output')
  let context = ''

  // Try to get the first paragraph or any descriptive text
  const firstParagraph = contentElement.find('p').first().text().trim()
  if (firstParagraph) {
    context = firstParagraph
  } else {
    // Fallback to any text content, cleaned up
    context = contentElement
      .text()
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000) // Limit length
  }

  return {
    name: characterListItem.name,
    countries: characterListItem.countries,
    popularity: characterListItem.popularity,
    other: characterListItem.other,
    url: fullUrl,
    imageUrls,
    context: context || undefined,
  }
}
