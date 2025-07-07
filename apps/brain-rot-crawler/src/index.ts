import { buildAIAgent } from './ai/index.js'
import { loadCharacterInfo } from './scrapers/character-info.js'
import { charactersList } from './scrapers/characters-list.js'
import type { AxiosError, Character } from './types/index.js'
import { generateCharacterId } from './utils/character-id.js'
import { CharactersJsonWriter } from './utils/characters-json-writer.js'
import { ImageDownloader } from './utils/image-downloader.js'
import { getLanguageFromCountries } from './utils/language-mapper.js'

const main = async () => {
  try {
    console.log('🤖 Initializing AI agent...')
    const aiAgent = await buildAIAgent()

    console.log('📷 Initializing image downloader...')
    const imageDownloader = new ImageDownloader()

    console.log('💾 Initializing JSON writer...')
    const jsonWriter = new CharactersJsonWriter()

    console.log('🕷️ Fetching character list...')
    const characterListItems = await charactersList()
    console.log(`📋 Characters found: ${characterListItems.length}`)

    const limitedList = characterListItems.slice(0, characterListItems.length)
    console.log(
      `🎯 Processing ${limitedList.length} characters with AI enhancement...`,
    )

    // Array to collect all processed characters
    const processedCharacters: Character[] = []

    for (const [index, characterListItem] of limitedList.entries()) {
      console.log(
        `\n[${index + 1}/${limitedList.length}] Processing: ${characterListItem.name}`,
      )

      let success = false
      let lastError: Error | unknown = null

      // Retry up to 3 times for each character
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          if (attempt > 1) {
            console.log(
              `   🔄 Retry attempt ${attempt}/3 for ${characterListItem.name}`,
            )
          }

          // Step 1: Scrape character information
          console.log('   📖 Scraping character data...')
          const character = await loadCharacterInfo(characterListItem)

          // Step 2: Enhance with AI
          console.log('   🤖 Enhancing with AI...')
          const enhancedCharacter = await aiAgent.enhance(character)

          // Step 3: Download and convert images
          console.log('   📷 Processing images...')
          const characterId = generateCharacterId(character.name)
          const downloadedImages =
            await imageDownloader.downloadCharacterImages(
              character.imageUrls || [],
              characterId,
            )

          // Step 4: Map language from countries
          const language = getLanguageFromCountries(character.countries)

          // Step 5: Combine scraped and enhanced data
          const fullCharacter: Character = {
            id: characterId,
            name: character.name,
            description: enhancedCharacter.description,
            gender: enhancedCharacter.gender,
            language: language,
            country: character.countries[0] || 'Unknown',
            voice: enhancedCharacter.voice,
            background: enhancedCharacter.background,
            motifs: enhancedCharacter.motifs,
            bgm: enhancedCharacter.bgm || '',
            catchphrases: enhancedCharacter.catchphrases,
            images: downloadedImages,
            popularity: character.popularity,
          }

          // Add to processed characters array
          processedCharacters.push(fullCharacter)

          console.log('   ✅ Character enhanced successfully!')
          console.log('   🎭 Voice selected:', enhancedCharacter.voice)
          console.log('   👤 Gender detected:', enhancedCharacter.gender)
          console.log('   🌍 Language mapped:', language)
          console.log('   📷 Images downloaded:', downloadedImages.length)

          // Output the enhanced character
          console.log('\n📄 Enhanced Character Data:')
          console.log(JSON.stringify(fullCharacter, null, 2))

          success = true
          break // Exit retry loop on success
        } catch (enhanceError) {
          lastError = enhanceError
          console.error(
            `   ❌ Attempt ${attempt}/3 failed for ${characterListItem.name}:`,
            enhanceError instanceof Error
              ? enhanceError.message
              : String(enhanceError),
          )

          // Wait before retrying (except on last attempt)
          if (attempt < 3) {
            const waitTime = attempt * 2000 // 2s, 4s
            console.log(`   ⏱️ Waiting ${waitTime / 1000}s before retry...`)
            await new Promise((resolve) => setTimeout(resolve, waitTime))
          }
        }
      }

      // Log final result for this character
      if (!success) {
        console.error(
          `   💀 Failed to process ${characterListItem.name} after 3 attempts. Final error:`,
          lastError instanceof Error ? lastError.message : String(lastError),
        )
        // Note: We skip adding failed characters to the final output
        // but could add a fallback version if needed
      }
    }

    // Save all processed characters to JSON file
    if (processedCharacters.length > 0) {
      console.log('\n💾 Saving characters to JSON file...')
      await jsonWriter.saveCharacters(processedCharacters)
    } else {
      console.log('\n⚠️ No characters were successfully processed')
    }

    console.log('\n🎉 Character processing complete!')
    console.log(
      `📊 Successfully processed: ${processedCharacters.length}/${limitedList.length} characters`,
    )
  } catch (error) {
    console.error(
      '💥 Error in main crawler:',
      error instanceof Error ? error.message : String(error),
    )
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as AxiosError
      console.error('Response status:', axiosError.response?.status)
      console.error('Response headers:', axiosError.response?.headers)
    }
  }
}

main()
