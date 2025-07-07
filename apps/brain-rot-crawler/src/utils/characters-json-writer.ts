import fs from 'node:fs/promises'
import path from 'node:path'

import type { Character } from '../types/character.js'

export interface CharactersData {
  characters: Character[]
  metadata: {
    version: string
    totalCharacters: number
    lastUpdated: string
    source: string
    description: string
  }
}

export class CharactersJsonWriter {
  private outputDir: string

  constructor(outputDir = '.output') {
    this.outputDir = outputDir
  }

  async saveCharacters(characters: Character[]): Promise<void> {
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true })

    // Create the data structure matching the example file
    const charactersData: CharactersData = {
      characters,
      metadata: {
        version: '1.0.0',
        totalCharacters: characters.length,
        lastUpdated: new Date().toISOString().split('T')[0] || '', // YYYY-MM-DD format
        source: 'Italian Brain-rot Crawler',
        description:
          'Collection of Italian brain-rot characters crawled and enhanced with AI',
      },
    }

    // Write to characters.json file
    const outputPath = path.join(this.outputDir, 'characters.json')
    const jsonContent = JSON.stringify(charactersData, null, 2)

    await fs.writeFile(outputPath, jsonContent, 'utf-8')

    console.log(`💾 Saved ${characters.length} characters to ${outputPath}`)
  }
}
