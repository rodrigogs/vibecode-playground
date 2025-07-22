'use client'

import type { FingerprintComponents } from './browser-fingerprinting'

/**
 * Client-side fingerprint collection utility
 * Executes browser fingerprinting in the client environment
 */

let cachedFingerprint: string | null = null

/**
 * Get cached fingerprint from localStorage with TTL
 */
function getCachedFingerprint(): string | null {
  try {
    const cached = localStorage.getItem('brf-fingerprint')
    if (!cached) return null

    const { fingerprint, timestamp } = JSON.parse(cached)
    const now = Date.now()
    const TTL = 24 * 60 * 60 * 1000 // 24 hours

    // Return cached fingerprint if it's still valid
    if (now - timestamp < TTL) {
      return fingerprint
    }

    // Remove expired cache
    localStorage.removeItem('brf-fingerprint')
    return null
  } catch {
    return null
  }
}

/**
 * Cache fingerprint in localStorage with timestamp
 */
function setCachedFingerprint(fingerprint: string): void {
  try {
    const cached = {
      fingerprint,
      timestamp: Date.now(),
    }
    localStorage.setItem('brf-fingerprint', JSON.stringify(cached))
  } catch {
    // Ignore localStorage errors (e.g., quota exceeded, private browsing)
  }
}

/**
 * Generate browser fingerprint on the client side
 */
export async function generateClientFingerprint(): Promise<string | null> {
  // Return cached fingerprint if available (memory cache first)
  if (cachedFingerprint) {
    return cachedFingerprint
  }

  // Check localStorage cache
  const localCached = getCachedFingerprint()
  if (localCached) {
    cachedFingerprint = localCached
    return cachedFingerprint
  }

  try {
    const components: FingerprintComponents = await collectBrowserData()
    cachedFingerprint = JSON.stringify(components)

    // Cache in localStorage for persistence across page refreshes
    setCachedFingerprint(cachedFingerprint)

    return cachedFingerprint
  } catch (error) {
    console.warn('Failed to generate browser fingerprint:', error)
    return null
  }
}

/**
 * Collect browser data for fingerprinting
 */
async function collectBrowserData(): Promise<FingerprintComponents> {
  const components: FingerprintComponents = {
    // Basic browser info
    userAgent: navigator.userAgent,
    language: navigator.language || 'en',
    timezone: getTimezone(),

    // Screen characteristics
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    devicePixelRatio: window.devicePixelRatio || 1,

    // Hardware signals
    hardwareConcurrency: navigator.hardwareConcurrency || 1,
    deviceMemory: (navigator as { deviceMemory?: number }).deviceMemory,

    // Advanced fingerprinting
    canvasFingerprint: await generateCanvasFingerprint(),
    webglFingerprint: generateWebGLFingerprint(),
    audioFingerprint: await generateAudioFingerprint(),

    // Feature detection
    featureSupport: detectFeatures(),

    // Font detection
    fontFingerprint: 'not-implemented', // Could be implemented with font measurement

    // Plugin detection
    pluginFingerprint: detectPlugins(),

    // Session-specific
    sessionId: generateSessionId(),

    // Automation detection
    automationFlags: detectAutomationFlags(),
  }

  return components
}

/**
 * Get timezone safely
 */
function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

/**
 * Generate canvas fingerprint
 */
async function generateCanvasFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return 'no-canvas'

    canvas.width = 200
    canvas.height = 50

    // Draw complex patterns that vary by rendering engine
    ctx.textBaseline = 'top'
    ctx.font = '14px "Arial"'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('Brain Rot Factory 🧠', 2, 15)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText('Canvas fingerprint', 4, 45)

    // Add some gradients and curves
    const gradient = ctx.createLinearGradient(0, 0, 200, 50)
    gradient.addColorStop(0, 'red')
    gradient.addColorStop(1, 'blue')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 200, 25)

    return canvas.toDataURL()
  } catch {
    return 'canvas-error'
  }
}

/**
 * Generate WebGL fingerprint
 */
function generateWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null
    if (!gl) return 'no-webgl'

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    const vendor = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      : gl.getParameter(gl.VENDOR)
    const renderer = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER)

    return `${vendor}|${renderer}`
  } catch {
    return 'webgl-error'
  }
}

/**
 * Generate audio fingerprint
 */
async function generateAudioFingerprint(): Promise<string> {
  try {
    const AudioContext =
      window.AudioContext ||
      (window as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!AudioContext) return 'no-audio-context'

    const audioContext = new AudioContext()
    const oscillator = audioContext.createOscillator()
    const analyser = audioContext.createAnalyser()
    const gainNode = audioContext.createGain()

    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(10000, audioContext.currentTime)

    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    oscillator.connect(analyser)
    analyser.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.start(0)
    oscillator.stop(audioContext.currentTime + 0.1)

    // Get frequency data for fingerprinting
    const frequencyData = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(frequencyData)

    // Convert to string for fingerprinting
    const signature = Array.from(frequencyData.slice(0, 10)).join(',')

    await audioContext.close()
    return signature
  } catch {
    return 'audio-error'
  }
}

/**
 * Detect available features
 */
function detectFeatures(): string {
  const features = []

  if ('serviceWorker' in navigator) features.push('sw')
  if ('webRTC' in navigator) features.push('webrtc')
  if ('getBattery' in navigator) features.push('battery')
  if ('geolocation' in navigator) features.push('geo')
  if ('vibrate' in navigator) features.push('vibrate')
  if ('connection' in navigator) features.push('connection')

  return features.join(',')
}

/**
 * Detect browser plugins
 */
function detectPlugins(): string {
  try {
    const plugins = Array.from(navigator.plugins).map((plugin) => plugin.name)
    return plugins.slice(0, 5).join(',') // Limit to first 5 to avoid huge strings
  } catch {
    return 'plugin-error'
  }
}

/**
 * Generate stable session ID that persists across page refreshes
 * Uses sessionStorage to maintain the same ID within a browser session
 */
function generateSessionId(): string {
  try {
    // Try to get existing session ID from sessionStorage
    const existingSessionId = sessionStorage.getItem('brf-session-id')
    if (existingSessionId) {
      return existingSessionId
    }

    // Generate new session ID if none exists
    const newSessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('brf-session-id', newSessionId)
    return newSessionId
  } catch {
    // Fallback if sessionStorage is not available (e.g., in private browsing)
    // Use a deterministic ID based on current session start time
    const sessionStart = Math.floor(Date.now() / (1000 * 60 * 30)) // 30-minute windows
    return `fallback-${sessionStart}`
  }
}

/**
 * Detect automation flags
 */
function detectAutomationFlags(): string {
  const flags = []

  // Check for webdriver
  if (navigator.webdriver) flags.push('webdriver')

  // Check for headless indicators
  if (
    !(window as { chrome?: unknown }).chrome &&
    navigator.userAgent.includes('Chrome')
  )
    flags.push('headless-chrome')
  if (navigator.userAgent.includes('HeadlessChrome')) flags.push('headless')

  // Check for unusual properties
  if (!navigator.plugins.length) flags.push('no-plugins')
  if (!navigator.languages?.length) flags.push('no-languages')

  // Check for automation-specific objects
  if ((window as { callPhantom?: unknown }).callPhantom) flags.push('phantom')
  if ((window as { _phantom?: unknown })._phantom) flags.push('phantom-alt')
  if ((window as { Buffer?: unknown }).Buffer) flags.push('node-env')

  return flags.join(',')
}
