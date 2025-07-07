'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useFingerprint } from '@/hooks/useFingerprint'
import type { BrainRotCharacter } from '@/types/characters'

export interface AudioManagerState {
  isSpeaking: boolean
  currentSpeakingMessageId: string | null
  isLoadingTTS: boolean
}

export interface AudioManagerActions {
  playBackgroundMusic: () => void
  stopBackgroundMusic: () => void
  stopAllAudio: () => void
  playBrainRotNotification: () => Promise<void>
  speakMessage: (
    messageId: string,
    content: string,
    character: BrainRotCharacter,
  ) => Promise<void>
}

export interface UseAudioManagerReturn
  extends AudioManagerState,
    AudioManagerActions {}

export function useAudioManager(): UseAudioManagerReturn {
  // Browser fingerprinting for enhanced rate limiting
  const { fingerprint } = useFingerprint()

  // State
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  const [currentSpeakingMessageId, setCurrentSpeakingMessageId] = useState<
    string | null
  >(null)
  const [isLoadingTTS, setIsLoadingTTS] = useState<boolean>(false)

  // Refs for audio elements
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null)
  const currentTTSAudioRef = useRef<HTMLAudioElement | null>(null)
  const brainrotNotificationRef = useRef<HTMLAudioElement | null>(null)
  const isStoppingIntentionally = useRef<boolean>(false)

  // Initialize background music
  const initializeBackgroundMusic = useCallback(() => {
    if (!backgroundMusicRef.current) {
      try {
        backgroundMusicRef.current = new Audio('/music/brain-rot.mp3')
        backgroundMusicRef.current.loop = true
        backgroundMusicRef.current.volume = 0.3
        backgroundMusicRef.current.preload = 'auto'

        backgroundMusicRef.current.addEventListener('error', (e) => {
          if (backgroundMusicRef.current) {
            console.error('Background music failed to load:', {
              error: e.error || e.message || 'Unknown error',
              src: backgroundMusicRef.current?.src,
              readyState: backgroundMusicRef.current?.readyState,
              networkState: backgroundMusicRef.current?.networkState,
            })
          }
        })
      } catch {
        // Failed to initialize background music
      }
    }
  }, [])

  // Initialize brain-rot notification sound
  const initializeBrainRotNotification = useCallback(() => {
    if (!brainrotNotificationRef.current) {
      try {
        brainrotNotificationRef.current = new Audio(
          '/music/brainrot-notification.mp3',
        )
        brainrotNotificationRef.current.volume = 0.6
        brainrotNotificationRef.current.preload = 'auto'

        brainrotNotificationRef.current.addEventListener('error', (e) => {
          if (brainrotNotificationRef.current) {
            console.error('Brain-rot notification sound failed to load:', {
              error: e.error || e.message || 'Unknown error',
              src: brainrotNotificationRef.current?.src,
              readyState: brainrotNotificationRef.current?.readyState,
              networkState: brainrotNotificationRef.current?.networkState,
            })
          }
        })
      } catch {
        // Failed to initialize brain-rot notification
      }
    }
  }, [])

  // Play background music
  const playBackgroundMusic = useCallback(() => {
    try {
      if (!backgroundMusicRef.current) {
        initializeBackgroundMusic()
      }

      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.currentTime = 0
        backgroundMusicRef.current.play().catch((error) => {
          console.log('Background music play was prevented:', error)
        })
      }
    } catch (error) {
      console.error('Error playing background music:', error)
    }
  }, [initializeBackgroundMusic])

  // Stop background music
  const stopBackgroundMusic = useCallback(() => {
    try {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause()
        backgroundMusicRef.current.currentTime = 0
      }
    } catch (error) {
      console.error('Error stopping background music:', error)
    }
  }, [])

  // Play brain-rot notification sound with bizarre distortions
  const playBrainRotNotification = useCallback(async () => {
    try {
      // Import the distortion system dynamically
      const { createDistortedNotification } = await import(
        '@/lib/audio-distortion'
      )

      const chaosLevel = Math.random()
      const intensityLevel = 0.6 + Math.random() * 0.4

      const distortedNotification = await createDistortedNotification(
        '/music/brainrot-notification.mp3',
        {
          intensity: intensityLevel,
          chaos: chaosLevel,
          enableBitCrush: Math.random() > 0.3,
          enableGranular: Math.random() > 0.2,
          enableReverse: Math.random() > 0.7,
          enablePitchShift: Math.random() > 0.1,
          enableGlitch: Math.random() > 0.4,
          enableSpectral: Math.random() > 0.5,
          enableTimeStretch: Math.random() > 0.6,
          enableRingMod: Math.random() > 0.4,
        },
      )

      const source = await distortedNotification.play()
      source.onended = () => {
        distortedNotification.cleanup()
      }
    } catch {
      // Fallback to original notification system
      try {
        if (!brainrotNotificationRef.current) {
          initializeBrainRotNotification()
        }

        if (brainrotNotificationRef.current) {
          brainrotNotificationRef.current.currentTime = 0
          const playPromise = brainrotNotificationRef.current.play()

          if (playPromise !== undefined) {
            await playPromise
          }
        }
      } catch {
        // Both distorted and fallback notification failed
      }
    }
  }, [initializeBrainRotNotification])

  // Stop all audio (TTS and background music)
  const stopAllAudio = useCallback(() => {
    try {
      isStoppingIntentionally.current = true

      // Reset speaking states
      setIsSpeaking(false)
      setIsLoadingTTS(false)
      setCurrentSpeakingMessageId(null)

      // Stop current TTS audio using ref
      if (currentTTSAudioRef.current) {
        currentTTSAudioRef.current.pause()
        currentTTSAudioRef.current.currentTime = 0
        currentTTSAudioRef.current.src = ''
        currentTTSAudioRef.current = null
      }

      // Stop any other TTS audio elements (fallback)
      const audioElements = document.querySelectorAll('audio[data-tts]')
      audioElements.forEach((audio) => {
        const audioElement = audio as HTMLAudioElement
        audioElement.pause()
        audioElement.currentTime = 0
        audioElement.src = ''
        audio.remove()
      })

      // Stop background music
      stopBackgroundMusic()
    } catch (error) {
      console.error('Error stopping all audio:', error)
    }
  }, [stopBackgroundMusic])

  // Speak message functionality
  const speakMessage = useCallback(
    async (
      messageId: string,
      content: string,
      character: BrainRotCharacter,
    ) => {
      // If currently loading TTS for the same message, allow cancellation
      if (isLoadingTTS && currentSpeakingMessageId === messageId) {
        stopAllAudio()
        return
      }

      // Prevent duplicate requests while TTS is loading for a different message
      if (isLoadingTTS && currentSpeakingMessageId !== messageId) {
        return
      }

      // If currently speaking the same message, stop it
      if (isSpeaking && currentSpeakingMessageId === messageId) {
        stopAllAudio()
        return
      }

      // If speaking a different message, stop current and continue to play new one
      if (isSpeaking && currentSpeakingMessageId !== messageId) {
        stopAllAudio()
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      try {
        setIsLoadingTTS(true)
        setCurrentSpeakingMessageId(messageId)
        playBackgroundMusic()

        // Call our OpenAI TTS API
        const ttsResponse = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: content,
            character: character,
            voice: 'ash',
            instructions: `Speak as ${character.name} with their personality: ${character.description}. Use an engaging, energetic tone that matches their character.`,
            format: 'mp3',
            fingerprint, // Include browser fingerprint for enhanced rate limiting
          }),
        })

        if (!ttsResponse.ok) {
          const errorText = await ttsResponse.text()
          throw new Error(
            `Failed to generate speech: ${ttsResponse.status} ${errorText}`,
          )
        }

        const audioBlob = await ttsResponse.blob()

        if (audioBlob.size === 0) {
          throw new Error('Received empty audio data')
        }

        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        audio.setAttribute('data-tts', 'true')
        audio.volume = 0.9
        audio.preload = 'auto'

        currentTTSAudioRef.current = audio
        setIsSpeaking(true)
        setIsLoadingTTS(false)

        audio.onended = () => {
          setIsSpeaking(false)
          setCurrentSpeakingMessageId(null)
          stopBackgroundMusic()
          URL.revokeObjectURL(audioUrl)
          if (currentTTSAudioRef.current === audio) {
            currentTTSAudioRef.current = null
          }
          audio.remove()
        }

        audio.onerror = () => {
          if (isStoppingIntentionally.current) {
            isStoppingIntentionally.current = false
            return
          }

          console.error(
            'TTS Audio playback error:',
            audio.error?.message || 'Unknown audio error',
          )

          setIsSpeaking(false)
          setIsLoadingTTS(false)
          setCurrentSpeakingMessageId(null)
          stopBackgroundMusic()

          if (currentTTSAudioRef.current === audio) {
            currentTTSAudioRef.current = null
          }

          URL.revokeObjectURL(audioUrl)
          audio.remove()

          alert(
            `Error occurred during text-to-speech playback. Audio error: ${
              audio.error?.message || 'Unknown audio error'
            }`,
          )
        }

        audio.oncanplaythrough = () => {
          if (backgroundMusicRef.current) {
            if (backgroundMusicRef.current.paused) {
              playBackgroundMusic()
            }
          }

          audio.play().catch((error) => {
            console.error('TTS audio play failed:', error)
            setIsSpeaking(false)
            setCurrentSpeakingMessageId(null)
            stopBackgroundMusic()
          })
        }

        // Fallback: play immediately if canplaythrough doesn't fire
        setTimeout(() => {
          if (audio.readyState >= 3) {
            audio.play().catch(() => {
              console.log('TTS audio fallback play failed')
            })
          }
        }, 500)
      } catch (error) {
        console.error('TTS Error:', error)
        setIsSpeaking(false)
        setIsLoadingTTS(false)
        setCurrentSpeakingMessageId(null)
        stopAllAudio()
        alert('Failed to generate speech. Please try again.')
      }
    },
    [
      fingerprint,
      isLoadingTTS,
      currentSpeakingMessageId,
      isSpeaking,
      playBackgroundMusic,
      stopAllAudio,
      stopBackgroundMusic,
    ],
  )

  // Initialize audio on first user interaction
  useEffect(() => {
    const enableAudioContext = () => {
      // Initialize both audio elements to "unlock" them
      initializeBackgroundMusic()
      initializeBrainRotNotification()

      console.log('Audio context enabled by user interaction')

      // Remove listeners after first interaction
      document.removeEventListener('click', enableAudioContext)
      document.removeEventListener('keydown', enableAudioContext)
      document.removeEventListener('touchstart', enableAudioContext)
    }

    // Add listeners for user interaction
    document.addEventListener('click', enableAudioContext)
    document.addEventListener('keydown', enableAudioContext)
    document.addEventListener('touchstart', enableAudioContext)

    return () => {
      // Remove listeners
      document.removeEventListener('click', enableAudioContext)
      document.removeEventListener('keydown', enableAudioContext)
      document.removeEventListener('touchstart', enableAudioContext)

      // Stop current TTS audio using ref
      if (currentTTSAudioRef.current) {
        currentTTSAudioRef.current.pause()
        currentTTSAudioRef.current.currentTime = 0
        currentTTSAudioRef.current.src = ''
        currentTTSAudioRef.current = null
      }

      // Stop any other TTS audio elements (fallback)
      const audioElements = document.querySelectorAll('audio[data-tts]')
      audioElements.forEach((audio) => {
        const audioElement = audio as HTMLAudioElement
        audioElement.pause()
        audioElement.currentTime = 0
        audioElement.src = ''
        audio.remove()
      })

      // Stop background music
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause()
        backgroundMusicRef.current.currentTime = 0
        backgroundMusicRef.current.src = ''
        backgroundMusicRef.current = null
      }

      // Stop brain-rot notification sound
      if (brainrotNotificationRef.current) {
        brainrotNotificationRef.current.pause()
        brainrotNotificationRef.current.currentTime = 0
        brainrotNotificationRef.current.src = ''
        brainrotNotificationRef.current = null
      }
    }
  }, [initializeBackgroundMusic, initializeBrainRotNotification])

  return {
    // State
    isSpeaking,
    currentSpeakingMessageId,
    isLoadingTTS,
    // Actions
    playBackgroundMusic,
    stopBackgroundMusic,
    stopAllAudio,
    playBrainRotNotification,
    speakMessage,
  }
}
