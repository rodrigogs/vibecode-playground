import { packageUpSync } from 'package-up'

export const findNearestPackageJson = (callerDir: string): string | null => {
  return packageUpSync({ cwd: callerDir }) ?? null
}
