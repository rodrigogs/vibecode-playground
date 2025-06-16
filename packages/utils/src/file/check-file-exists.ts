import fs from 'node:fs'

export const checkFileExists = async (absoluteFilePath: string) => {
  try {
    await fs.promises.access(absoluteFilePath)
    return true
  } catch {
    return false
  }
}
