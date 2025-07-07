import * as cheerio from 'cheerio'

import { buildAxiosAgent } from '../http/agent.js'

/**
 * Extracts the original image URL from a MediaWiki File page
 * @param filePageUrl - The URL to the File: page (e.g., https://italianbrainrot.miraheze.org/wiki/File:image.jpg)
 * @returns The direct URL to the original image, or undefined if not found
 */
export const extractOriginalImageUrl = async (
  filePageUrl: string,
): Promise<string | undefined> => {
  try {
    const agent = buildAxiosAgent()
    const response = await agent.get(filePageUrl)
    const $ = cheerio.load(response.data)

    // Strategy 1: Look for the "Original file" link (most reliable when present)
    let originalFileLink = $('a:contains("Original file")').attr('href')

    if (!originalFileLink) {
      // Strategy 2: Try the specific selector pattern you mentioned
      originalFileLink = $(
        '#mw-content-text > div.mw-content-ltr.fullMedia > p > bdi > a',
      ).attr('href')
    }

    if (!originalFileLink) {
      // Strategy 3: Look for any link in the fullMedia section that points to static.wikitide.net
      originalFileLink = $(
        '#mw-content-text .fullMedia a[href*="static.wikitide.net"]',
      ).attr('href')
    }

    if (!originalFileLink) {
      // Strategy 4: Look for the main file link in the content area
      originalFileLink = $(
        '#mw-content-text a[href*="static.wikitide.net"]:first',
      ).attr('href')
    }

    if (originalFileLink) {
      // If it's a relative URL, make it absolute
      if (originalFileLink.startsWith('//')) {
        return `https:${originalFileLink}`
      } else if (originalFileLink.startsWith('/')) {
        const baseUrl = new URL(filePageUrl)
        return `${baseUrl.origin}${originalFileLink}`
      }
      return originalFileLink
    }

    return undefined
  } catch (error) {
    console.warn(
      `Failed to extract original image URL from ${filePageUrl}:`,
      error,
    )
    return undefined
  }
}
