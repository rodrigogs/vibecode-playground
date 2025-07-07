import fs from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

import { buildAxiosAgent } from '../http/agent.js'

export interface ImageDownloadResult {
  filename: string
  path: string
  size: number
}

export class ImageDownloader {
  private outputDir: string
  private agent = buildAxiosAgent()

  constructor(outputDir = '.output/images') {
    this.outputDir = outputDir
  }

  async downloadAndConvert(
    imageUrl: string,
    characterId: string,
    index: number,
  ): Promise<ImageDownloadResult> {
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true })

    // Generate filename
    const filename = `${characterId}-${index}.webp`
    const outputPath = path.join(this.outputDir, filename)

    try {
      console.log(`     📸 Downloading image ${index + 1}: ${imageUrl}`)

      // Download the image
      const response = await this.agent.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
      })

      // Convert to WebP using Sharp
      const buffer = Buffer.from(response.data)
      const webpBuffer = await sharp(buffer)
        .webp({
          quality: 85, // Good quality with compression
          effort: 6, // Good compression effort
        })
        .toBuffer()

      // Save to file
      await fs.writeFile(outputPath, webpBuffer)

      const stats = await fs.stat(outputPath)

      console.log(
        `     ✅ Image saved: ${filename} (${Math.round(stats.size / 1024)}KB)`,
      )

      return {
        filename,
        path: outputPath,
        size: stats.size,
      }
    } catch (error) {
      console.error(`     ❌ Failed to download image ${imageUrl}:`, error)
      throw error
    }
  }

  async downloadCharacterImages(
    imageUrls: string[],
    characterId: string,
  ): Promise<string[]> {
    if (!imageUrls.length) {
      console.log('     📷 No images to download')
      return []
    }

    console.log(`     📷 Downloading ${imageUrls.length} image(s)...`)

    const downloadedImages: string[] = []

    for (const [index, imageUrl] of imageUrls.entries()) {
      try {
        const result = await this.downloadAndConvert(
          imageUrl,
          characterId,
          index,
        )
        downloadedImages.push(result.filename)
      } catch {
        console.warn(`     ⚠️ Skipping failed image ${index + 1}`)
        // Continue with other images even if one fails
      }
    }

    console.log(
      `     🎉 Downloaded ${downloadedImages.length}/${imageUrls.length} images`,
    )

    return downloadedImages
  }
}
