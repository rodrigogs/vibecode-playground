/**
 * Generate a character ID from a character name
 * Converts to lowercase, replaces spaces and special characters with hyphens
 */
export function generateCharacterId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}
