import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

export const diceRollerTool = new DynamicStructuredTool({
  name: 'dice_roller',
  description: 'Roll dice with specified number of sides and count',
  schema: z.object({
    count: z.number().min(1).max(10).describe('Number of dice to roll (1-10)'),
    sides: z
      .number()
      .min(2)
      .max(100)
      .default(6)
      .describe('Number of sides on each die (default: 6)'),
  }),
  func: async ({ count, sides }) => {
    const rolls = []
    let total = 0

    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * sides) + 1
      rolls.push(roll)
      total += roll
    }

    const diceFacts = [
      'The oldest known dice were found in Iran and date back to around 3000 BCE!',
      'Casino dice are made with extremely precise measurements to ensure fairness.',
      'A standard die has dots called "pips" that always add up to 7 on opposite faces.',
      'The probability of rolling any specific number on a fair die is always equal.',
      'Dice are used in over 5,000 different board games worldwide!',
      'The ancient Romans were so obsessed with dice games that Julius Caesar said "The die is cast" when crossing the Rubicon.',
      'Modern casino dice are often made from cellulose acetate and are transparent.',
      'The word "dice" comes from the Latin word "datum," meaning "something given."',
    ]

    const randomFact = diceFacts[Math.floor(Math.random() * diceFacts.length)]

    let result = `🎲 Rolling ${count} dice with ${sides} sides each\n\nResults: ${rolls.join(', ')}\nTotal: ${total}`

    if (rolls.length > 1) {
      result += `\nAverage: ${(total / rolls.length).toFixed(1)}`
    }

    result += `\n\n🎲 Dice Fun Fact: ${randomFact}`

    return result
  },
})
