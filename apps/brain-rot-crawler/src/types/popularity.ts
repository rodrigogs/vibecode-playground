import type { PopularityLevel } from './character.js'

export interface PopularityImageElement {
  attr: (name: string) => string | undefined
}

export type PopularityResolverFunction = (
  popularityImage: unknown,
) => PopularityLevel
