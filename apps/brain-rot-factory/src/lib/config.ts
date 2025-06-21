import { readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { FileUtils } from '@repo/utils'

const rootPkg = FileUtils.findRootPackageJson(FileUtils.getDirname()) ?? ''
const pkg = JSON.parse(readFileSync(rootPkg, 'utf-8'))

export const config = {
  DATA_DIR: process.env.DATA_DIR ?? path.join(os.homedir(), `.${pkg.name}`),
}
