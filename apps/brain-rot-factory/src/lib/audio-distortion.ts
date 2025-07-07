/**
 * Bizarre Audio Distortion Engine for Brain-rot Factory
 *
 * This module provides creative and chaotic audio distortions using the Web Audio API.
 * Inspired by experimental sound design, granular synthesis, and brain-rot aesthetics.
 */

export interface DistortionConfig {
  // Core distortion settings
  intensity?: number // 0-1, how crazy the distortion gets
  chaos?: number // 0-1, randomness factor

  // Individual effect toggles
  enableBitCrush?: boolean
  enableGranular?: boolean
  enableReverse?: boolean
  enablePitchShift?: boolean
  enableGlitch?: boolean
  enableSpectral?: boolean
  enableTimeStretch?: boolean
  enableRingMod?: boolean
}

export class BizarreAudioDistorter {
  private audioContext: AudioContext
  private sourceBuffer: AudioBuffer | null = null
  private effectsChain: AudioNode[] = []

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext
  }

  /**
   * Load audio from URL and prepare for processing
   */
  async loadAudio(url: string): Promise<void> {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    this.sourceBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
  }

  /**
   * Apply bizarre distortions to the loaded audio
   */
  async playDistorted(
    config: DistortionConfig = {},
  ): Promise<AudioBufferSourceNode> {
    if (!this.sourceBuffer) {
      throw new Error('No audio loaded. Call loadAudio() first.')
    }

    // Default config with maximum chaos
    const defaultConfig: Required<DistortionConfig> = {
      intensity: 0.8,
      chaos: 0.9,
      enableBitCrush: true,
      enableGranular: true,
      enableReverse: Math.random() > 0.5,
      enablePitchShift: true,
      enableGlitch: true,
      enableSpectral: true,
      enableTimeStretch: Math.random() > 0.3,
      enableRingMod: true,
    }

    const finalConfig = { ...defaultConfig, ...config }

    // Create source node
    const source = this.audioContext.createBufferSource()

    // Apply random chaos to the source buffer
    const processedBuffer = await this.processBuffer(
      this.sourceBuffer,
      finalConfig,
    )
    source.buffer = processedBuffer

    // Create effects chain
    let currentNode: AudioNode = source
    this.effectsChain = []

    // 1. Bit Crusher (digital degradation)
    if (finalConfig.enableBitCrush) {
      const bitCrusher = this.createBitCrusher(finalConfig)
      currentNode.connect(bitCrusher)
      currentNode = bitCrusher
      this.effectsChain.push(bitCrusher)
    }

    // 2. Ring Modulator (metallic/robotic effect)
    if (finalConfig.enableRingMod) {
      const ringMod = this.createRingModulator(finalConfig)
      currentNode.connect(ringMod)
      currentNode = ringMod
      this.effectsChain.push(ringMod)
    }

    // 3. Spectral Mangler (frequency domain chaos)
    if (finalConfig.enableSpectral) {
      const spectral = this.createSpectralMangler(finalConfig)
      currentNode.connect(spectral)
      currentNode = spectral
      this.effectsChain.push(spectral)
    }

    // 4. Dynamic Filter (moving filter madness)
    const dynamicFilter = this.createDynamicFilter(finalConfig)
    currentNode.connect(dynamicFilter)
    currentNode = dynamicFilter
    this.effectsChain.push(dynamicFilter)

    // 5. Glitch Effect (random dropouts and stutters)
    if (finalConfig.enableGlitch) {
      const glitch = this.createGlitchEffect(finalConfig)
      currentNode.connect(glitch)
      currentNode = glitch
      this.effectsChain.push(glitch)
    }

    // 6. Final Gain and Limiter
    const limiter = this.createLimiter()
    currentNode.connect(limiter)
    limiter.connect(this.audioContext.destination)
    this.effectsChain.push(limiter)

    // Start playback
    source.start()

    return source
  }

  /**
   * Process the audio buffer directly with time-domain effects
   */
  private async processBuffer(
    buffer: AudioBuffer,
    config: Required<DistortionConfig>,
  ): Promise<AudioBuffer> {
    const channels = buffer.numberOfChannels
    const length = buffer.length
    const sampleRate = buffer.sampleRate

    // Create new buffer for processed audio
    const processedBuffer = this.audioContext.createBuffer(
      channels,
      length,
      sampleRate,
    )

    for (let channel = 0; channel < channels; channel++) {
      const inputData = buffer.getChannelData(channel)
      const outputData = processedBuffer.getChannelData(channel)

      // Copy input to output first
      outputData.set(inputData)

      // Apply reverse effect
      if (config.enableReverse) {
        this.applyReverse(outputData)
      }

      // Apply granular synthesis effect
      if (config.enableGranular) {
        this.applyGranularEffect(outputData, config)
      }

      // Apply pitch shifting
      if (config.enablePitchShift) {
        this.applyPitchShift(outputData, config)
      }

      // Apply time stretching
      if (config.enableTimeStretch) {
        this.applyTimeStretch(outputData)
      }

      // Apply chaos (random sample manipulation)
      this.applyChaos(outputData, config)
    }

    return processedBuffer
  }

  /**
   * Reverse the audio buffer
   */
  private applyReverse(data: Float32Array): void {
    const length = data.length
    for (let i = 0; i < length / 2; i++) {
      const temp = data[i]
      data[i] = data[length - 1 - i]
      data[length - 1 - i] = temp
    }
  }

  /**
   * Apply granular synthesis effect (chop up and rearrange audio)
   */
  private applyGranularEffect(
    data: Float32Array,
    config: Required<DistortionConfig>,
  ): void {
    const grainSize = Math.floor(64 + config.intensity * 256) // 64-320 samples
    const numGrains = Math.floor(data.length / grainSize)

    // Create grain array
    const grains: Float32Array[] = []
    for (let i = 0; i < numGrains; i++) {
      const start = i * grainSize
      const grain = data.slice(start, start + grainSize)
      grains.push(grain)
    }

    // Shuffle grains based on chaos level
    if (config.chaos > 0.3) {
      for (let i = grains.length - 1; i > 0; i--) {
        if (Math.random() < config.chaos) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[grains[i], grains[j]] = [grains[j], grains[i]]
        }
      }
    }

    // Reconstruct with random overlaps
    data.fill(0)
    for (let i = 0; i < grains.length; i++) {
      const startPos =
        i * grainSize +
        Math.floor((Math.random() - 0.5) * grainSize * config.chaos * 0.5)
      const grain = grains[i]

      for (let j = 0; j < grain.length; j++) {
        const pos = startPos + j
        if (pos >= 0 && pos < data.length) {
          data[pos] += grain[j] * (1 - config.chaos * 0.3) // Reduce volume for overlaps
        }
      }
    }
  }

  /**
   * Apply pitch shifting using a simple resampling technique
   */
  private applyPitchShift(
    data: Float32Array,
    config: Required<DistortionConfig>,
  ): void {
    const pitchFactor = 0.5 + Math.random() * 1.5 + config.intensity * 0.5 // 0.5x to 2.5x speed
    const newData = new Float32Array(data.length)

    for (let i = 0; i < data.length; i++) {
      const sourceIndex = i * pitchFactor
      const baseIndex = Math.floor(sourceIndex)
      const fraction = sourceIndex - baseIndex

      if (baseIndex < data.length - 1) {
        newData[i] =
          data[baseIndex] * (1 - fraction) + data[baseIndex + 1] * fraction
      } else if (baseIndex < data.length) {
        newData[i] = data[baseIndex]
      }
    }

    data.set(newData)
  }

  /**
   * Apply time stretching (change tempo without changing pitch)
   */
  private applyTimeStretch(data: Float32Array): void {
    const stretchFactor = 0.7 + Math.random() * 0.6 // 0.7x to 1.3x
    const hopSize = 256
    const frameSize = 1024

    // Simple overlap-add time stretching
    const newData = new Float32Array(data.length)
    let outputPos = 0

    for (
      let inputPos = 0;
      inputPos < data.length - frameSize;
      inputPos += Math.floor(hopSize * stretchFactor)
    ) {
      if (outputPos + frameSize >= newData.length) break

      // Apply windowing and overlap-add
      for (let i = 0; i < frameSize; i++) {
        const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (frameSize - 1))) // Hann window
        if (inputPos + i < data.length && outputPos + i < newData.length) {
          newData[outputPos + i] += data[inputPos + i] * window
        }
      }
      outputPos += hopSize
    }

    data.set(newData)
  }

  /**
   * Apply random chaos to samples
   */
  private applyChaos(
    data: Float32Array,
    config: Required<DistortionConfig>,
  ): void {
    for (let i = 0; i < data.length; i++) {
      if (Math.random() < config.chaos * 0.1) {
        // Random sample replacement
        data[i] = (Math.random() - 0.5) * config.intensity * 0.3
      } else if (Math.random() < config.chaos * 0.05) {
        // Sample dropout
        data[i] = 0
      } else if (Math.random() < config.chaos * 0.03) {
        // Sample repetition
        if (i > 0) {
          data[i] = data[i - 1]
        }
      }
    }
  }

  /**
   * Create bit crusher effect
   */
  private createBitCrusher(
    config: Required<DistortionConfig>,
  ): AudioWorkletNode | WaveShaperNode {
    try {
      // Try to use AudioWorklet for better performance
      const bitCrusher = new AudioWorkletNode(
        this.audioContext,
        'bit-crusher-processor',
      )
      return bitCrusher
    } catch {
      // Fallback to ScriptProcessorNode simulation using WaveShaper
      const bitCrusher = this.audioContext.createWaveShaper()
      const samples = 65536
      const curve = new Float32Array(samples)
      const bits = Math.max(1, Math.floor(16 - config.intensity * 12)) // 4-16 bits
      const step = Math.pow(2, bits - 1)

      for (let i = 0; i < samples; i++) {
        const x = (i - samples / 2) / (samples / 2)
        curve[i] = Math.floor(x * step) / step
      }

      bitCrusher.curve = curve
      bitCrusher.oversample = 'none'
      return bitCrusher
    }
  }

  /**
   * Create ring modulator effect
   */
  private createRingModulator(config: Required<DistortionConfig>): GainNode {
    const ringMod = this.audioContext.createGain()
    const modulator = this.audioContext.createOscillator()
    const modGain = this.audioContext.createGain()

    // Modulation frequency between 10Hz and 1000Hz based on intensity
    const modFreq = 10 + config.intensity * 990 + Math.random() * 200
    modulator.frequency.setValueAtTime(modFreq, this.audioContext.currentTime)
    modulator.type = Math.random() > 0.5 ? 'sine' : 'square'

    // Modulation depth
    modGain.gain.setValueAtTime(
      0.3 + config.intensity * 0.7,
      this.audioContext.currentTime,
    )

    modulator.connect(modGain)
    modGain.connect(ringMod.gain)
    modulator.start()

    return ringMod
  }

  /**
   * Create spectral mangler using convolver
   */
  private createSpectralMangler(
    config: Required<DistortionConfig>,
  ): ConvolverNode {
    const convolver = this.audioContext.createConvolver()

    // Create chaotic impulse response
    const length = this.audioContext.sampleRate * 0.1 // 100ms impulse
    const impulse = this.audioContext.createBuffer(
      2,
      length,
      this.audioContext.sampleRate,
    )

    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        // Create chaotic impulse with random spikes
        if (Math.random() < config.intensity * 0.01) {
          data[i] = (Math.random() - 0.5) * 2
        } else {
          data[i] = (Math.random() - 0.5) * 0.01 * Math.exp((-i / length) * 5)
        }
      }
    }

    convolver.buffer = impulse
    return convolver
  }

  /**
   * Create dynamic filter effect
   */
  private createDynamicFilter(
    config: Required<DistortionConfig>,
  ): BiquadFilterNode {
    const filter = this.audioContext.createBiquadFilter()
    const lfo = this.audioContext.createOscillator()
    const lfoGain = this.audioContext.createGain()

    // Random filter type
    const filterTypes: BiquadFilterType[] = [
      'lowpass',
      'highpass',
      'bandpass',
      'notch',
    ]
    filter.type = filterTypes[Math.floor(Math.random() * filterTypes.length)]

    // Base frequency
    const baseFreq = 200 + Math.random() * 2000
    filter.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime)

    // Q factor for resonance
    filter.Q.setValueAtTime(
      1 + config.intensity * 20,
      this.audioContext.currentTime,
    )

    // LFO modulation
    const lfoRate = 0.1 + Math.random() * 5
    lfo.frequency.setValueAtTime(lfoRate, this.audioContext.currentTime)
    lfo.type = 'triangle'

    lfoGain.gain.setValueAtTime(
      baseFreq * config.intensity,
      this.audioContext.currentTime,
    )

    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    lfo.start()

    return filter
  }

  /**
   * Create glitch effect using gain automation
   */
  private createGlitchEffect(config: Required<DistortionConfig>): GainNode {
    const glitch = this.audioContext.createGain()

    // Schedule random gain changes
    const currentTime = this.audioContext.currentTime
    const duration = 2.0 // 2 seconds of glitch patterns

    let time = currentTime
    while (time < currentTime + duration) {
      const glitchChance = config.chaos * 0.8

      if (Math.random() < glitchChance) {
        // Random dropout
        glitch.gain.setValueAtTime(0, time)
        glitch.gain.setValueAtTime(1, time + 0.01 + Math.random() * 0.1)
        time += 0.05 + Math.random() * 0.1
      } else if (Math.random() < glitchChance * 0.5) {
        // Random volume spike
        glitch.gain.setValueAtTime(0.2 + Math.random() * 0.8, time)
        time += 0.02 + Math.random() * 0.05
      } else {
        time += 0.01
      }
    }

    return glitch
  }

  /**
   * Create limiter to prevent clipping
   */
  private createLimiter(): DynamicsCompressorNode {
    const limiter = this.audioContext.createDynamicsCompressor()

    limiter.threshold.setValueAtTime(-6, this.audioContext.currentTime)
    limiter.knee.setValueAtTime(5, this.audioContext.currentTime)
    limiter.ratio.setValueAtTime(20, this.audioContext.currentTime)
    limiter.attack.setValueAtTime(0.003, this.audioContext.currentTime)
    limiter.release.setValueAtTime(0.01, this.audioContext.currentTime)

    return limiter
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.effectsChain.forEach((node) => {
      try {
        node.disconnect()
      } catch {
        // Ignore disconnect errors
      }
    })
    this.effectsChain = []
  }
}

/**
 * Convenience function to create and use the distorter
 */
export async function createDistortedNotification(
  audioUrl: string,
  config: DistortionConfig = {},
): Promise<{
  play: () => Promise<AudioBufferSourceNode>
  cleanup: () => void
}> {
  const audioContext = new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext)()
  const distorter = new BizarreAudioDistorter(audioContext)

  await distorter.loadAudio(audioUrl)

  return {
    play: () => distorter.playDistorted(config),
    cleanup: () => {
      distorter.cleanup()
      audioContext.close()
    },
  }
}
