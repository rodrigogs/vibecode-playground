import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as toolsIndex from './index.js'

// Mock all external dependencies for DigitalCompanionUI tests
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  input: vi.fn(),
}))

vi.mock('@langchain/core/messages', () => ({
  HumanMessage: vi.fn(),
}))

vi.mock('@langchain/langgraph', () => ({
  MemorySaver: vi.fn(() => ({})),
}))

vi.mock('@repo/ai', () => ({
  createAgent: vi.fn(() => ({
    invoke: vi.fn(),
  })),
  PersistentCheckpointSaver: vi.fn().mockImplementation(() => ({
    // Mock the checkpoint saver methods if needed
    put: vi.fn(),
    get: vi.fn(),
    list: vi.fn(),
  })),
}))

vi.mock('@repo/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}))

vi.mock('boxen', () => ({
  default: vi.fn((text) => `[BOX]${text}[/BOX]`),
}))

vi.mock('chalk', () => {
  const mockFn = (text: any) => text
  const createMockColor = () => {
    const colorFn = mockFn
    ;(colorFn as any).bold = mockFn
    return colorFn
  }
  const createMockBold = () => {
    const boldFn = mockFn
    ;(boldFn as any).yellow = mockFn
    ;(boldFn as any).cyan = mockFn
    ;(boldFn as any).red = mockFn
    ;(boldFn as any).green = mockFn
    ;(boldFn as any).white = mockFn
    ;(boldFn as any).blue = mockFn
    ;(boldFn as any).magenta = mockFn
    ;(boldFn as any).gray = mockFn
    return boldFn
  }

  return {
    default: {
      cyan: createMockColor(),
      red: createMockColor(),
      green: createMockColor(),
      yellow: createMockColor(),
      white: createMockColor(),
      blue: createMockColor(),
      magenta: createMockColor(),
      gray: createMockColor(),
      bold: createMockBold(),
    },
  }
})

vi.mock('figlet', () => ({
  default: {
    textSync: vi.fn(() => 'ASCII_ART_TEXT'),
  },
}))

vi.mock('gradient-string', () => ({
  rainbow: vi.fn((text) => text),
}))

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
  })),
}))

describe('Tools Index - Unit Tests', () => {
  it.each([
    ['jokeGeneratorTool'],
    ['asciiArtTool'],
    ['calculatorTool'],
    ['diceRollerTool'],
    ['coinFlipperTool'],
    ['writingPromptTool'],
    ['colorGeneratorTool'],
  ] as const)('should export %s', (toolName) => {
    expect(toolsIndex).toHaveProperty(toolName)
  })

  it('should have exactly 7 tool exports', () => {
    expect(Object.keys(toolsIndex)).toHaveLength(7)
  })

  it('should export valid tool objects', () => {
    Object.values(toolsIndex).forEach((tool) => {
      expect(tool).toBeDefined()
      expect(tool).toHaveProperty('name')
      expect(tool).toHaveProperty('description')
      expect(tool).toHaveProperty('schema')
      expect(tool).toHaveProperty('func')
      expect(typeof tool.name).toBe('string')
      expect(typeof tool.description).toBe('string')
      expect(typeof tool.func).toBe('function')
      expect(tool.schema).toBeDefined()
    })
  })

  it('should have unique tool names', () => {
    const toolNames = Object.values(toolsIndex).map((tool) => tool.name)
    const uniqueNames = new Set(toolNames)
    expect(uniqueNames.size).toBe(toolNames.length)
  })

  it('should have descriptive tool names', () => {
    const expectedNames = [
      'joke_generator',
      'ascii_art',
      'calculator',
      'dice_roller',
      'coin_flipper',
      'writing_prompt',
      'color_generator',
    ]

    const actualNames = Object.values(toolsIndex).map((tool) => tool.name)
    expectedNames.forEach((expectedName) => {
      expect(actualNames).toContain(expectedName)
    })
  })
})

// DigitalCompanionUI Tests
describe('DigitalCompanionUI - Unit Tests', () => {
  let originalConsole: any
  let originalProcess: any

  beforeEach(async () => {
    // Dynamic imports with mocking
    vi.doMock('@inquirer/prompts', () => ({
      select: vi.fn(),
      input: vi.fn(),
    }))

    vi.doMock('@langchain/core/messages', () => ({
      HumanMessage: vi.fn(),
    }))

    vi.doMock('@langchain/langgraph', () => ({
      MemorySaver: vi.fn(() => ({})),
    }))

    vi.doMock('@repo/ai', () => ({
      createAgent: vi.fn(() => ({
        invoke: vi.fn(),
      })),
      PersistentCheckpointSaver: vi.fn().mockImplementation(() => ({
        // Mock the checkpoint saver methods if needed
        put: vi.fn(),
        get: vi.fn(),
        list: vi.fn(),
      })),
    }))

    vi.doMock('@repo/logger', () => ({
      createLogger: vi.fn(() => ({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      })),
    }))

    vi.doMock('boxen', () => ({
      default: vi.fn((text) => `[BOX]${text}[/BOX]`),
    }))

    vi.doMock('chalk', () => {
      const mockFn = (text: any) => text
      const createMockColor = () => {
        const colorFn = mockFn
        ;(colorFn as any).bold = mockFn
        return colorFn
      }
      const createMockBold = () => {
        const boldFn = mockFn
        ;(boldFn as any).yellow = mockFn
        ;(boldFn as any).cyan = mockFn
        ;(boldFn as any).red = mockFn
        ;(boldFn as any).green = mockFn
        ;(boldFn as any).white = mockFn
        ;(boldFn as any).blue = mockFn
        ;(boldFn as any).magenta = mockFn
        ;(boldFn as any).gray = mockFn
        return boldFn
      }

      return {
        default: {
          cyan: createMockColor(),
          red: createMockColor(),
          green: createMockColor(),
          yellow: createMockColor(),
          white: createMockColor(),
          blue: createMockColor(),
          magenta: createMockColor(),
          gray: createMockColor(),
          bold: createMockBold(),
        },
      }
    })

    vi.doMock('figlet', () => ({
      default: {
        textSync: vi.fn(() => 'ASCII_ART_TEXT'),
      },
    }))

    vi.doMock('gradient-string', () => ({
      rainbow: vi.fn((text) => text),
    }))

    vi.doMock('ora', () => ({
      default: vi.fn(() => ({
        start: vi.fn().mockReturnThis(),
        stop: vi.fn().mockReturnThis(),
      })),
    }))

    // Setup test environment
    originalConsole = { ...console }
    originalProcess = { ...process }

    console.clear = vi.fn()
    console.clear = vi.fn()
    console.log = vi.fn()
    process.exit = vi.fn() as any
  })
  afterEach(() => {
    Object.assign(console, originalConsole)
    // Only restore specific process properties that we modified
    process.exit = originalProcess.exit
    vi.clearAllMocks()
  })

  it('should export DigitalCompanionUI class', async () => {
    const { DigitalCompanionUI } = await import('../index.js')
    expect(DigitalCompanionUI).toBeDefined()
    expect(typeof DigitalCompanionUI).toBe('function')
  })

  it('should export main function', async () => {
    const { main } = await import('../index.js')
    expect(main).toBeDefined()
    expect(typeof main).toBe('function')
    expect(main.constructor.name).toBe('AsyncFunction')
  })

  it('should create DigitalCompanionUI instance successfully', async () => {
    const { DigitalCompanionUI } = await import('../index.js')
    const companion = new DigitalCompanionUI()

    expect(companion).toBeDefined()
    expect(companion).toBeInstanceOf(DigitalCompanionUI)
  })

  it('should have proper run method', async () => {
    const { DigitalCompanionUI } = await import('../index.js')
    const companion = new DigitalCompanionUI()

    expect(companion.run).toBeDefined()
    expect(typeof companion.run).toBe('function')
  })
})
