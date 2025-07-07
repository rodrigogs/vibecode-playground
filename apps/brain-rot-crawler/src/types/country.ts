import type { Country } from './character.js'

export interface CountryImageElement {
  attr: (name: string) => string | undefined
}

export type CountryResolverFunction = (
  countryImage: unknown,
) => Country | undefined
