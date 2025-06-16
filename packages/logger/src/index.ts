import { FileUtils } from '@repo/utils'
import debug from 'debug'
import fs from 'fs'

const getCallerDir = () => {
  const originalFunc = Error.prepareStackTrace
  let callerfile
  try {
    const err = new Error()
    Error.prepareStackTrace = (_, stack) => stack
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stack = err.stack as unknown as any[]
    const currentfile = stack.shift().getFileName()
    while (stack.length) {
      callerfile = stack.shift().getFileName()
      if (currentfile !== callerfile) break
    }
  } catch (e) {
    console.error(e)
  }
  Error.prepareStackTrace = originalFunc
  return callerfile
}

export type LogLevel = 'info' | 'error' | 'warn' | 'debug'

export const createLogger = (namespace: string) => {
  const currentDir = getCallerDir()

  const rootPkgPath = FileUtils.findRootPackageJson(currentDir)
  if (!rootPkgPath) {
    throw new Error('Root package path not found')
  }

  const pkgPath = FileUtils.findNearestPackageJson(currentDir)
  if (!pkgPath) {
    throw new Error('Package path not found')
  }

  const currentModulePkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  const moduleName = currentModulePkg.name.startsWith('@')
    ? currentModulePkg.name.split('/').pop()
    : currentModulePkg.name
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'))

  const rootModuleName = rootPkg.name.startsWith('@')
    ? rootPkg.name.split('/').pop()
    : rootPkg.name
  const createNamespace = (type: LogLevel, namespace: string) =>
    `${rootModuleName}:${type}:${moduleName}:${namespace}`

  return {
    info: debug(createNamespace('info', namespace)),
    error: debug(createNamespace('error', namespace)),
    warn: debug(createNamespace('warn', namespace)),
    debug: debug(createNamespace('debug', namespace)),
  }
}
