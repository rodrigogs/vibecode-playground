import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

export const writingPromptTool = new DynamicStructuredTool({
  name: 'writing_prompt',
  description:
    'Generate creative writing prompts for stories, essays, or creative exercises',
  schema: z.object({
    genre: z
      .enum([
        'fantasy',
        'sci-fi',
        'mystery',
        'romance',
        'horror',
        'adventure',
        'slice-of-life',
        'random',
      ])
      .default('random')
      .describe('Genre for the writing prompt'),
    length: z
      .enum(['short', 'medium', 'long'])
      .default('medium')
      .describe('Length of the prompt'),
  }),
  func: async (params) => {
    // Ensure defaults are applied
    const genre = params.genre || 'random'
    const length = params.length || 'medium'
    const prompts = {
      'fantasy': {
        short: [
          "A dragon discovers it's allergic to fire.",
          'Your reflection starts moving independently.',
          'Magic stops working for exactly 24 hours.',
          "A wizard's spell goes hilariously wrong.",
        ],
        medium: [
          'In a world where everyone has a magical familiar, yours is a rubber duck that gives surprisingly wise advice.',
          'You inherit a bookshop where the characters literally leap off the pages after closing time.',
          "A young mage discovers their power only works when they're telling dad jokes.",
          'The last dragon on Earth runs a small coffee shop in downtown Portland.',
        ],
        long: [
          "In a realm where emotions manifest as physical creatures, you're a therapist who helps people wrangle their anxiety monsters and depression shadows. One day, you encounter someone whose joy creature has gone missing, and you must venture into the darkest corners of their psyche to bring it back.",
          "Every thousand years, the gods play a game using mortals as pieces. You've just discovered you're a pawn, but you've also found the rulebook. Now you must decide: play by their rules, or rewrite the game entirely.",
        ],
      },
      'sci-fi': {
        short: [
          "Aliens arrive, but they're just really bad tourists.",
          'Your smart home becomes too smart.',
          "Time travel exists, but it's subscription-based.",
          'Robots start forming labor unions.',
        ],
        medium: [
          'In 2157, memories can be downloaded and shared like files. You work for the Memory Police, tracking down illegal nostalgic experiences.',
          "Earth's AI decides humanity needs a mandatory vacation and locks everyone out of all technology for a week.",
          'You discover your apartment building is actually a generation ship, and rent is just a way to fund the journey.',
          'Scientists invent a device that translates animal thoughts, but discover pets have been gossiping about humans for centuries.',
        ],
        long: [
          "Humanity has colonized the galaxy, but Earth has been forgotten and is now considered a myth. You're an archaeologist who discovers coordinates to the legendary 'birthworld' hidden in ancient data cores. The journey there reveals that Earth isn't just lost—it's been deliberately hidden, and something ancient still guards it.",
          'In a world where consciousness can be backed up and restored, death becomes temporary. But when people start dying permanently—their backups corrupted by an unknown virus—you must investigate a conspiracy that reaches into the very nature of what it means to be human.',
        ],
      },
      'mystery': {
        short: [
          'The murder weapon keeps changing every time you look at it.',
          'Everyone in town has the same alibi.',
          'The victim keeps appearing in security footage after their death.',
          "The detective realizes they're the prime suspect.",
        ],
        medium: [
          'A librarian discovers that books in their library are rewriting themselves overnight, always changing the ending to murder mysteries.',
          "Every morning, you wake up to find a new clue about a crime that hasn't been committed yet.",
          "A small town's residents all claim to have committed the same murder, but the victim is still alive.",
          "Messages keep appearing in your coffee foam, leading you deeper into a conspiracy you didn't know existed.",
        ],
        long: [
          "You're a detective in a city where everyone wears masks, and removing someone's mask without permission is the highest crime. When masked bodies start appearing with their faces revealed, you must solve murders while navigating a society built on anonymity and discovering that the killer might be trying to show you something about your own hidden identity.",
        ],
      },
      'slice-of-life': {
        short: [
          "Your barista knows everyone's order by heart except yours.",
          'Two neighbors communicate only through garden gnomes.',
          'A food truck that only appears when people really need it.',
          'Your houseplants start leaving passive-aggressive notes.',
        ],
        medium: [
          'You work at a 24-hour laundromat where the most interesting conversations happen at 3 AM.',
          'Every Tuesday, the same mysterious person leaves origami cranes with tiny messages around your neighborhood.',
          "You've been pen pals with someone for years without knowing they live in the apartment above you.",
          'A community garden becomes the center of unlikely friendships between very different people.',
        ],
        long: [
          "You inherit a small, struggling bookstore from a relative you barely knew. As you try to keep it running, you discover that each regular customer has a story that somehow connects to your own past in ways you're only beginning to understand. Through their stories and your conversations, you slowly piece together why your relative left you this particular gift.",
        ],
      },
      'romance': {
        short: [
          'You keep running into the same person at the worst possible moments.',
          'Two rival food truck owners compete for the same corner.',
          'Your book club becomes a matchmaking service.',
          'A shared grocery list leads to unexpected conversations.',
        ],
        medium: [
          'You work the night shift at a 24-hour radio station, and someone keeps calling in with song requests that tell a story.',
          'A wedding planner and a divorce lawyer discover they have more in common than they thought.',
          'You find love letters hidden in a used bookstore, and decide to track down the writers.',
          "Two people keep accidentally getting each other's mail, leading to an unusual correspondence.",
        ],
        long: [
          "In a world where people can temporarily trade emotional memories like currency, you work as an \"emotion broker.\" When you accidentally experience someone's memory of first love, you become determined to find them and return what isn't yours. But the search reveals that love memories are being stolen and sold, and the person you're looking for might be both the victim and the key to stopping it.",
        ],
      },
      'horror': {
        short: [
          'Your reflection starts doing things a few seconds before you do.',
          "The elevator in your building has a button for a floor that doesn't exist.",
          'Your favorite childhood toy appears on your doorstep after 20 years.',
          'Everyone in your town stops talking at exactly the same time.',
        ],
        medium: [
          "You inherit a house where every room's temperature corresponds to the emotions of people who lived there.",
          "A sleep study you volunteered for reveals that you've been sharing dreams with the same stranger for years.",
          "Your new apartment's previous tenant left behind a mirror that shows what happened in each room.",
          "The local library's return slot has been accepting books that were never checked out.",
        ],
        long: [
          "You work as a home insurance investigator, documenting strange claims. When you notice patterns in seemingly unrelated cases—families reporting that their houses are \"breathing,\" children drawing the same shadowy figure, pets refusing to enter certain rooms—you realize something is systematically visiting homes across the city. But the deeper you investigate, the more you suspect it's not looking for victims. It's looking for the perfect house. And you just found out it's been to yours.",
        ],
      },
      'adventure': {
        short: [
          "Your GPS keeps directing you to places that don't exist on any map.",
          "A treasure map falls out of a library book you've checked out.",
          'Your hiking trail splits in two, but only one path is on your map.',
          "You find a key that doesn't fit any lock in your house.",
        ],
        medium: [
          "While urban exploring, you discover a hidden network of tunnels beneath your city that leads to places you've never heard of.",
          'A viral social media challenge sends you on a scavenger hunt that becomes unexpectedly real.',
          'You volunteer for a historical reenactment that turns out to be more historically accurate than advertised.',
          'Your metal detector hobby leads you to buried items that seem to belong to people who are still alive.',
        ],
        long: [
          "You inherit your grandfather's antique compass, but it doesn't point north—it points to whatever you need most. At first it's small things: your lost keys, a good parking spot, the perfect coffee shop. But when it starts pointing toward people—a lost child, a missing hiker, someone in danger—you realize the compass isn't just finding things. It's choosing you for something bigger, and the final direction it's leading you might change everything.",
        ],
      },
    }

    // Handle random genre selection
    const selectedGenre =
      genre === 'random'
        ? ([
            'fantasy',
            'sci-fi',
            'mystery',
            'slice-of-life',
            'romance',
            'horror',
            'adventure',
          ][Math.floor(Math.random() * 7)] as keyof typeof prompts)
        : (genre as keyof typeof prompts)

    const genrePrompts = prompts[selectedGenre]
    const lengthPrompts = genrePrompts[length]
    const selectedPrompt =
      lengthPrompts[Math.floor(Math.random() * lengthPrompts.length)]

    return `✍️ Here's your ${length} ${selectedGenre} writing prompt:\n\n"${selectedPrompt}"\n\n🌟 Happy writing! Let your imagination run wild!`
  },
})
