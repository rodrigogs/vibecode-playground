import type { Other } from './character.js'

export interface OtherImageElement {
  attr: (name: string) => string | undefined
}

export type OtherResolverFunction = (otherImage: unknown) => Other | undefined
