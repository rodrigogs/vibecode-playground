import { checkFileExists } from './check-file-exists.js'
import { findNearestPackageJson } from './find-nearest-package-json.js'
import { findRootPackageJson } from './find-root-package-json.js'
import { getDirname } from './get-dirname.js'
import { getFilename } from './get-filename.js'

/**
 * Utility module for file system operations.
 */
export const FileUtils = {
  checkFileExists,
  findNearestPackageJson,
  findRootPackageJson,
  getDirname,
  getFilename,
}
