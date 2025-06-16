import { promises as fs } from 'fs'
import os from 'os'
import outmatch from 'outmatch'
import { join } from 'path'

import type { CacheAdapter } from '../cache-adapter.js'

interface FileContent {
  value: unknown
  expiresAt?: number
  isBinary?: boolean
}

export class FsCacheAdapter implements CacheAdapter {
  private directory: string

  constructor(directory?: string) {
    this.directory = directory || join(os.tmpdir(), 'fs_cache_adapter')
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const expiresAt = ttl ? Date.now() + ttl : undefined

    // Handle Uint8Array specially
    if (value instanceof Uint8Array) {
      const data: FileContent = {
        value: Array.from(value), // Convert to array for JSON serialization
        expiresAt,
        isBinary: true,
      }
      await fs.mkdir(this.directory, { recursive: true })
      await fs.writeFile(
        join(this.directory, key),
        JSON.stringify(data),
        'utf-8',
      )
    } else {
      const data: FileContent = { value, expiresAt }
      await fs.mkdir(this.directory, { recursive: true })
      await fs.writeFile(
        join(this.directory, key),
        JSON.stringify(data),
        'utf-8',
      )
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const content = await fs.readFile(join(this.directory, key), 'utf-8')
      const data: FileContent = JSON.parse(content)
      if (data.expiresAt && Date.now() > data.expiresAt) {
        await this.delete(key)
        return undefined
      }

      // Convert back to Uint8Array if it was binary data
      if (data.isBinary && Array.isArray(data.value)) {
        return new Uint8Array(data.value) as T
      }

      return data.value as T
    } catch {
      return undefined
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await fs.unlink(join(this.directory, key))
      return true
    } catch {
      return false
    }
  }

  async flush(): Promise<void> {
    try {
      const files = await fs.readdir(this.directory)
      await Promise.all(
        files.map((file: string) => fs.unlink(join(this.directory, file))),
      )
    } catch {
      // ignore if directory doesn't exist
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      const files = await fs.readdir(this.directory)

      // Se nenhum padrão for fornecido ou for '*', retorne todas as chaves
      if (!pattern || pattern === '*') {
        return files
      }

      // Cria um matcher a partir do padrão e filtra os arquivos
      const isMatch = outmatch(pattern)
      return files.filter(isMatch)
    } catch {
      // Em caso de erro (diretório inexistente, por exemplo), retorna lista vazia
      return []
    }
  }
}
