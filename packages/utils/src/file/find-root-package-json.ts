import path from 'node:path'

import { findNearestPackageJson } from './find-nearest-package-json.js'

/**
 * Finds the root package.json file by traversing up the directory tree
 * until no more parent package.json files are found.
 *
 * @param startDir - The directory to start searching from
 * @returns The absolute path to the root package.json file, or null if not found
 */
export const findRootPackageJson = (startDir: string): string | null => {
  let currentDir = startDir
  let lastPackageJson: string | null = null
  let iterations = 0
  const maxIterations = 20 // Safety limit to prevent infinite loops

  while (iterations < maxIterations) {
    const packageJsonPath = findNearestPackageJson(currentDir)

    if (!packageJsonPath) {
      // No package.json found, return the last one we found
      return lastPackageJson
    }

    // Update the last found package.json
    lastPackageJson = packageJsonPath

    // Move to the parent directory of the current package.json
    const packageDir = path.dirname(packageJsonPath)
    const parentDir = path.dirname(packageDir)

    // If we've reached the filesystem root or can't go higher, stop
    if (parentDir === packageDir || parentDir === '/') {
      break
    }

    currentDir = parentDir
    iterations++
  }

  return lastPackageJson
}
