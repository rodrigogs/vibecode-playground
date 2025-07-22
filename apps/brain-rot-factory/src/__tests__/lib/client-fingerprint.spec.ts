/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('Client Fingerprint Caching', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    // Mock sessionStorage
    const sessionStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }

    Object.defineProperty(global, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    })

    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })

    // Mock other browser APIs
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Test Browser)',
        language: 'en-US',
        hardwareConcurrency: 8,
        plugins: [],
        webdriver: false,
      },
      writable: true,
    })

    Object.defineProperty(global, 'screen', {
      value: {
        width: 1920,
        height: 1080,
        colorDepth: 24,
      },
      writable: true,
    })

    Object.defineProperty(global, 'Intl', {
      value: {
        DateTimeFormat: () => ({
          resolvedOptions: () => ({ timeZone: 'UTC' }),
        }),
      },
      writable: true,
    })

    Object.defineProperty(global, 'document', {
      value: {
        createElement: vi.fn(() => ({
          getContext: vi.fn(() => ({
            fillStyle: '',
            fillRect: vi.fn(),
            fillText: vi.fn(),
            createLinearGradient: vi.fn(() => ({
              addColorStop: vi.fn(),
            })),
            textBaseline: '',
            font: '',
          })),
          toDataURL: vi.fn(() => 'data:image/png;base64,test'),
          width: 0,
          height: 0,
        })),
      },
      writable: true,
    })
  })

  it('should generate stable session ID using sessionStorage', async () => {
    // First call - sessionStorage returns null, so it should create new ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.sessionStorage.getItem as any).mockReturnValueOnce(null)

    const { generateClientFingerprint } = await import(
      '@/lib/client-fingerprint'
    )

    const fingerprint1 = await generateClientFingerprint()
    expect(fingerprint1).toBeTruthy()

    // Should have called setItem to store the session ID
    expect(global.sessionStorage.setItem).toHaveBeenCalledWith(
      'brf-session-id',
      expect.stringMatching(/^\d+-[a-z0-9]{9}$/),
    )

    // Get the stored session ID for the next call
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setItemCall = (global.sessionStorage.setItem as any).mock.calls[0]
    const storedSessionId = setItemCall[1]

    // Second call - sessionStorage returns the stored ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.sessionStorage.getItem as any).mockReturnValueOnce(storedSessionId)

    const fingerprint2 = await generateClientFingerprint()
    expect(fingerprint2).toBeTruthy()
    expect(fingerprint1).toBe(fingerprint2)
  })

  it('should use fallback session ID when sessionStorage fails', async () => {
    // Mock sessionStorage to throw errors
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.sessionStorage.getItem as any).mockImplementation(() => {
      throw new Error('sessionStorage unavailable')
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.sessionStorage.setItem as any).mockImplementation(() => {
      throw new Error('sessionStorage unavailable')
    })

    const { generateClientFingerprint } = await import(
      '@/lib/client-fingerprint'
    )

    const fingerprint = await generateClientFingerprint()
    expect(fingerprint).toBeTruthy()

    // Should contain fallback session ID (time-based or static fallback)
    const parsedFingerprint = JSON.parse(fingerprint!)
    expect(parsedFingerprint.sessionId).toMatch(/^(fallback-\d+|fallback)$/)
  })

  it('should cache fingerprint in localStorage', async () => {
    const { generateClientFingerprint } = await import(
      '@/lib/client-fingerprint'
    )

    // First call should generate fingerprint
    const fingerprint1 = await generateClientFingerprint()
    expect(fingerprint1).toBeTruthy()

    // Should have attempted to cache in localStorage
    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'brf-fingerprint',
      expect.stringContaining('"timestamp":'),
    )
  })
})
