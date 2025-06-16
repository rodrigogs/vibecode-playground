import os from 'node:os'
import path from 'node:path'

import { input, select } from '@inquirer/prompts'
import { HumanMessage } from '@langchain/core/messages'
import { createAgent, PersistentCheckpointSaver } from '@repo/ai'
import { FsCacheAdapter } from '@repo/cache'
import { createLogger } from '@repo/logger'
import boxen from 'boxen'
import chalk from 'chalk'
import figlet from 'figlet'
import { rainbow } from 'gradient-string'
import ora from 'ora'

import * as tools from './tools/index.js'

const logger = createLogger('example')

// Menu configuration constants
const MAIN_MENU_CHOICES = [
  {
    name: '💬 Chat with your Digital Companion',
    value: 'chat',
    description: 'Start a continuous conversation (type /q to return to menu)',
  },
  {
    name: '🎯 Quick Creative Tasks',
    value: 'quick',
    description: 'Choose from pre-made creative prompts',
  },
  {
    name: '👋 Exit',
    value: 'exit',
    description: 'Say goodbye to your companion',
  },
] as const

const QUICK_TASK_CHOICES = [
  {
    name: '🎪 Tell me a joke and create ASCII art',
    value:
      'Tell me a programming joke and then create some ASCII art of a robot',
  },
  {
    name: '🎲 Roll dice, flip coins, and get a writing prompt',
    value:
      'Roll 3 dice and flip 2 coins, then give me a creative writing prompt based on the results',
  },
  {
    name: '🧮 Math + Colors + Fun facts',
    value:
      "What's the square root of 144? Then generate a random color and tell me a fun fact",
  },
  {
    name: '🐱 Cat ASCII art + Dad joke',
    value: 'Create ASCII art of a cat and tell me a dad joke',
  },
  {
    name: '🚀 Space exploration writing prompt',
    value: 'Give me a creative writing prompt about space exploration',
  },
  {
    name: '🎨 Surprise me with something creative!',
    value:
      'Surprise me with something creative! Use multiple tools to create something fun and unique.',
  },
  {
    name: '⬅️ Back to main menu',
    value: 'back',
  },
] as const

// Welcome screen content
const WELCOME_CONTENT =
  chalk.cyan.bold('🤖 Your AI Creative Assistant\n\n') +
  chalk.white('Available Tools:\n') +
  chalk.yellow('🎪 Joke Generator\n') +
  chalk.yellow('🎨 ASCII Art Creator\n') +
  chalk.yellow('🎲 Dice & Coin Tools\n') +
  chalk.yellow('✍️  Creative Writing Prompts\n') +
  chalk.yellow('🧮 Math Calculator\n') +
  chalk.yellow('🌈 Random Color & Facts\n\n') +
  chalk.magenta('💾 Persistent Memory: Your conversations are saved!\n\n') +
  chalk.green('Ready to chat and have some creative fun!')

const WELCOME_BOX_OPTIONS = {
  padding: 1,
  margin: 1,
  borderStyle: 'round' as const,
  borderColor: 'cyan',
  backgroundColor: '#1a1a1a',
}

// Interactive Digital Companion Agent
export class DigitalCompanionUI {
  private agent: ReturnType<typeof createAgent>
  private checkpointSaver: PersistentCheckpointSaver
  private threadId: string

  constructor() {
    // Create a filesystem cache adapter for persistent memory
    const persistenceFilePath = path.join(
      os.homedir(),
      '.digital-companion',
      'persistent_memory.json',
    )
    const fsCache = new FsCacheAdapter(persistenceFilePath)
    // Create a persistent checkpoint saver
    this.checkpointSaver = new PersistentCheckpointSaver(
      fsCache,
      'digital-companion',
    )

    // Use a consistent thread ID for conversation continuity
    this.threadId = 'digital-companion-session'

    this.agent = createAgent({
      name: 'DigitalCompanion',
      provider: 'openai',
      model: 'gpt-4o-mini',
      tools: Object.values(tools),
      checkpointSaver: this.checkpointSaver,
    })
  }

  // Display welcome screen with beautiful ASCII art
  private displayWelcome() {
    console.clear()

    const title = figlet.textSync('Digital Companion', {
      font: 'Big',
      horizontalLayout: 'default',
      verticalLayout: 'default',
    })

    console.log(rainbow(title))
    console.log(boxen(WELCOME_CONTENT, WELCOME_BOX_OPTIONS))
  }

  // Main menu options
  private async showMainMenu(): Promise<string> {
    return await select({
      message: chalk.cyan.bold('What would you like to do?'),
      choices: MAIN_MENU_CHOICES,
    })
  }

  // Quick creative task menu
  private async showQuickTasks(): Promise<string> {
    return await select({
      message: chalk.magenta.bold('Choose a creative task:'),
      choices: QUICK_TASK_CHOICES,
    })
  }

  // Handle continuous chat interaction
  private async handleChat() {
    console.log(
      chalk.cyan.bold('\n💬 Starting continuous chat mode!\n') +
        chalk.white(
          'You can now chat continuously with your Digital Companion.\n',
        ) +
        chalk.yellow('Type ') +
        chalk.bold.yellow('/q') +
        chalk.yellow(' to return to the main menu.\n'),
    )

    while (true) {
      try {
        const userInput = await input({
          message: chalk.green.bold('You:'),
          validate: (input: string) => {
            if (input.trim().length === 0) {
              return 'Please enter a message!'
            }
            return true
          },
        })

        // Check if user wants to quit chat mode
        if (userInput.trim().toLowerCase() === '/q') {
          console.log(chalk.cyan('📱 Returning to main menu...\n'))
          break
        }

        await this.processMessage(userInput)
      } catch (error) {
        if (this.isExitError(error)) {
          this.exitApplication()
        }
        console.log(chalk.red('An error occurred in chat:'), error)
        break
      }
    }
  }

  // Extract text content from complex message content
  private extractMessageContent(messageContent: unknown): string {
    if (typeof messageContent === 'string') {
      return messageContent
    }

    if (!Array.isArray(messageContent)) {
      return 'No response received'
    }

    return messageContent
      .map((part) => {
        if (typeof part === 'string') {
          return part
        }

        if (part && typeof part === 'object') {
          // Handle text content
          if ('text' in part && typeof part.text === 'string') {
            return part.text
          }
          if ('type' in part && part.type === 'text' && 'text' in part) {
            return part.text as string
          }
          // Handle other content types
          if ('type' in part) {
            return part.type === 'image_url' ? '[Image]' : '[Content]'
          }
        }

        return ''
      })
      .join('')
  }

  // Display agent response in a formatted box
  private displayResponse(content: string) {
    const responseBox = boxen(
      chalk.cyan.bold('🤖 Digital Companion:\n\n') + chalk.white(content),
      {
        padding: 1,
        margin: { top: 1, bottom: 1, left: 0, right: 0 },
        borderStyle: 'round',
        borderColor: 'green',
      },
    )
    console.log(responseBox)
  }

  // Display error message
  private displayError(error: unknown) {
    console.log(chalk.red.bold('❌ Oops! Something went wrong:'))
    console.log(
      chalk.red(error instanceof Error ? error.message : String(error)),
    )
  }

  // Process message with loading spinner
  private async processMessage(message: string) {
    const spinner = ora({
      text: chalk.cyan('🤖 Your companion is thinking...'),
      spinner: 'dots12',
    }).start()

    try {
      const response = await this.agent.invoke(
        {
          messages: [new HumanMessage(message)],
        },
        {
          configurable: {
            thread_id: this.threadId,
          },
        },
      )

      const lastMessage = response.messages[response.messages.length - 1]
      const agentResponse = this.extractMessageContent(lastMessage?.content)

      spinner.stop()
      this.displayResponse(agentResponse)
    } catch (error) {
      spinner.stop()
      this.displayError(error)
    }
  }

  // Check if error is an exit prompt error
  private isExitError(error: unknown): error is { name: string } {
    return (
      error !== null &&
      typeof error === 'object' &&
      'name' in error &&
      (error as { name: unknown }).name === 'ExitPromptError'
    )
  }

  // Handle application exit
  private exitApplication() {
    console.log(rainbow('\n👋 Thanks for chatting! See you next time!\n'))
    process.exit(0)
  }

  // Main application loop
  async run(maxIterations: number = Infinity) {
    this.displayWelcome()
    let iterations = 0

    while (iterations < maxIterations) {
      iterations++
      try {
        const choice = await this.showMainMenu()

        switch (choice) {
          case 'chat':
            await this.handleChat()
            // No need to pause after chat since it handles its own exit
            continue

          case 'quick': {
            const quickTask = await this.showQuickTasks()
            if (quickTask !== 'back') {
              await this.processMessage(quickTask)
            }
            break
          }

          case 'exit':
            this.exitApplication()
            return

          default:
            console.log(chalk.red('Invalid choice. Please try again.'))
            break
        }

        // Pause before showing menu again (except after chat)
        await input({
          message: chalk.gray('Press Enter to continue...'),
        })
      } catch (error) {
        if (this.isExitError(error)) {
          this.exitApplication()
          return
        }
        console.log(chalk.red('An error occurred:'), error)
        // Exit after error handling for better testing
        return
      }
    }
  }
}

// Run the interactive Digital Companion
export async function main() {
  logger.info('🚀 Starting Interactive Digital Companion Agent...')

  const companion = new DigitalCompanionUI()
  await companion.run()
}
