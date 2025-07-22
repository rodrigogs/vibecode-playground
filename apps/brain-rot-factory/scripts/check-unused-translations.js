#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Function to get all translation keys from a JSON object
function getAllKeys(obj, prefix = '') {
  let keys = []

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (
      typeof obj[key] === 'object' &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      keys = keys.concat(getAllKeys(obj[key], fullKey))
    } else {
      keys.push(fullKey)
    }
  }

  return keys
}

// Function to extract t() calls from the About page
function extractUsedKeys(fileContent) {
  const regex = /t\(['"`]([^'"`]+)['"`]\)/g
  const matches = []
  let match

  while ((match = regex.exec(fileContent)) !== null) {
    matches.push(match[1])
  }

  return matches
}

async function main() {
  try {
    // Read the About page component
    const aboutPagePath = path.join(
      __dirname,
      '../src/app/[locale]/about/page.tsx',
    )
    const aboutPageContent = fs.readFileSync(aboutPagePath, 'utf8')

    // Extract used translation keys
    const usedKeys = extractUsedKeys(aboutPageContent)
    console.log(
      `📄 Found ${usedKeys.length} translation keys used in About page\n`,
    )

    // Read the English translation file
    const enTranslationPath = path.join(
      __dirname,
      '../src/messages/en/about.json',
    )
    const enTranslations = JSON.parse(
      fs.readFileSync(enTranslationPath, 'utf8'),
    )

    // Get all available keys
    const allAvailableKeys = getAllKeys(enTranslations)
    console.log(
      `📚 Found ${allAvailableKeys.length} total translation keys available\n`,
    )

    // Find unused keys
    const unusedKeys = allAvailableKeys.filter((key) => !usedKeys.includes(key))

    if (unusedKeys.length > 0) {
      console.log(`🔍 UNUSED TRANSLATION KEYS (${unusedKeys.length}):`)
      console.log('='.repeat(50))

      // Group by top-level section
      const groupedUnused = {}
      unusedKeys.forEach((key) => {
        const topLevel = key.split('.')[0]
        if (!groupedUnused[topLevel]) {
          groupedUnused[topLevel] = []
        }
        groupedUnused[topLevel].push(key)
      })

      // Sort by section and display
      Object.keys(groupedUnused)
        .sort()
        .forEach((section) => {
          console.log(`\n📂 ${section.toUpperCase()}:`)
          groupedUnused[section].sort().forEach((key) => {
            console.log(`   - ${key}`)
          })
        })

      // Show sample content for major unused sections
      console.log('\n' + '='.repeat(50))
      console.log('📋 SAMPLE CONTENT FROM MAJOR UNUSED SECTIONS:')
      console.log('='.repeat(50))

      const majorSections = [
        'qualityReflection',
        'creativeProcess',
        'aiJourney',
        'aboutCreation',
      ]
      majorSections.forEach((section) => {
        if (groupedUnused[section]) {
          console.log(`\n🔗 ${section.toUpperCase()} section preview:`)
          if (enTranslations[section] && enTranslations[section].title) {
            console.log(`   Title: ${enTranslations[section].title}`)
          }
          if (enTranslations[section] && enTranslations[section].description) {
            console.log(
              `   Description: ${enTranslations[section].description.substring(0, 100)}...`,
            )
          }
        }
      })
    } else {
      console.log('✅ All translation keys are being used!')
    }

    // Check for keys used but not available
    const missingKeys = usedKeys.filter(
      (key) => !allAvailableKeys.includes(key),
    )
    if (missingKeys.length > 0) {
      console.log(`\n❌ USED BUT NOT AVAILABLE (${missingKeys.length}):`)
      missingKeys.forEach((key) => {
        console.log(`   - ${key}`)
      })
    }
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

main()
