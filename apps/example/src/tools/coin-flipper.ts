import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

export const coinFlipperTool = new DynamicStructuredTool({
  name: 'coin_flipper',
  description: 'Flip coins and get heads or tails results',
  schema: z.object({
    count: z
      .number()
      .min(1)
      .max(10)
      .default(1)
      .describe('Number of coins to flip (1-10)'),
  }),
  func: async ({ count }) => {
    const flips = []
    let heads = 0
    let tails = 0

    for (let i = 0; i < count; i++) {
      const result = Math.random() < 0.5 ? 'heads' : 'tails'
      flips.push(result)
      if (result === 'heads') heads++
      else tails++
    }

    const resultsText = flips
      .map((flip) => (flip === 'heads' ? '👑 Heads' : '🔶 Tails'))
      .join(', ')

    let result = `🪙 Flipping ${count} coins\n\nResults: ${resultsText}\n\nSummary:\nHeads: ${heads}\nTails: ${tails}`

    // Add fun facts about coins
    const coinFacts = [
      'The earliest coins were made around 650 BC in Lydia (modern-day Turkey)!',
      'A coin flip has a 50.76% chance of landing on the same side it started on.',
      'The most expensive coin ever sold was a 1933 Double Eagle for $18.9 million!',
      'Coins can actually land on their edge - the probability is about 1 in 6,000.',
      'The phrase "heads or tails" comes from Roman coins featuring emperors and eagles.',
      'Some coins are designed to be slightly weighted to make flipping more fair.',
      'The ridges on coin edges were originally added to prevent people from shaving off metal.',
      'In ancient times, people would bite coins to test if they were real gold or silver!',
    ]

    const randomFact = coinFacts[Math.floor(Math.random() * coinFacts.length)]
    result += `\n\n🪙 Coin Fun Fact: ${randomFact}`

    return result
  },
})
