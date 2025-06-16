import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

export const jokeGeneratorTool = new DynamicStructuredTool({
  name: 'joke_generator',
  description: 'Generate random programming jokes or dad jokes',
  schema: z.object({
    type: z
      .enum(['programming', 'dad', 'random'])
      .describe('Type of joke to generate'),
  }),
  func: async ({ type }) => {
    const jokes = {
      programming: [
        "Why don't programmers like nature? It has too many bugs.",
        "How many programmers does it take to change a light bulb? None – that's a hardware problem.",
        "Why did the programmer quit his job? Because he didn't get arrays.",
        "A SQL query goes into a bar, walks up to two tables and asks: 'Can I join you?'",
        "Why do Java developers wear glasses? Because they can't C#.",
        'How do you comfort a JavaScript bug? You console it.',
        'Why did the developer go broke? Because he used up all his cache.',
        "What's a programmer's favorite hangout place? Foo Bar.",
      ],
      dad: [
        "Why don't scientists trust atoms? Because they make up everything!",
        "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them.",
        'Why did the scarecrow win an award? He was outstanding in his field!',
        'What do you call a fake noodle? An impasta!',
        "Why don't eggs tell jokes? They'd crack each other up!",
        "What's the best thing about Switzerland? I don't know, but the flag is a big plus.",
        'Why did the math book look so sad? Because it had too many problems!',
        'What do you call a bear with no teeth? A gummy bear!',
      ],
    }

    const funFacts = [
      'Laughter can boost your immune system and reduce stress hormones!',
      'The average person laughs about 17 times per day.',
      "Studies show that people who laugh regularly live longer than those who don't.",
      'Laughter burns calories - about 10-40 calories for 10-15 minutes of laughing!',
      'The "funny bone" isn\'t actually a bone - it\'s your ulnar nerve.',
      'Babies start laughing at around 3-4 months old, even before they can speak.',
      'Laughter is contagious because of mirror neurons in our brains.',
      'The oldest recorded joke dates back to 1900 BCE from ancient Sumeria!',
    ]

    let selectedJokes: string[]
    let jokeType: string
    let emoji: string

    if (type === 'random') {
      const allJokes = [...jokes.programming, ...jokes.dad]
      const randomJoke = allJokes[Math.floor(Math.random() * allJokes.length)]

      if (!randomJoke) {
        return 'No jokes available at the moment!'
      }

      // Determine if it's a programming or dad joke
      if (jokes.programming.includes(randomJoke)) {
        jokeType = 'Programming Joke'
        emoji = '🎪'
      } else {
        jokeType = 'Dad Joke'
        emoji = '👨'
      }

      const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)]
      return `${emoji} ${jokeType}:\n\n"${randomJoke}"\n\n💡 Fun Fact: ${randomFact || 'Laughter is the best medicine!'}`
    } else {
      selectedJokes = jokes[type as keyof typeof jokes]
      const randomJoke =
        selectedJokes[Math.floor(Math.random() * selectedJokes.length)]

      if (!randomJoke) {
        return 'No jokes available for this type!'
      }

      if (type === 'programming') {
        jokeType = 'Programming Joke'
        emoji = '🎪'
      } else {
        jokeType = 'Dad Joke'
        emoji = '👨'
      }

      const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)]
      return `${emoji} ${jokeType}:\n\n"${randomJoke}"\n\n💡 Fun Fact: ${randomFact || 'Laughter is the best medicine!'}`
    }
  },
})
