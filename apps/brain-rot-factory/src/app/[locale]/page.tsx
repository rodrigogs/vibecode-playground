'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Import components
import BrainRotCarousel from '@/components/BrainRotCarousel'
import ChatInterface from '@/components/ChatInterface'
import type { ChatMessage } from '@/components/ChatMessage'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
// Import character utilities and types
import charactersData from '@/data/characters.json'
import type { BrainRotCharacter } from '@/types/characters'

const brainRotCharacters: BrainRotCharacter[] = (
  charactersData as { characters: BrainRotCharacter[] }
).characters.filter((character) => !character.disabled)

export default function Home() {
  const [prompt, setPrompt] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  const [currentSpeakingMessageId, setCurrentSpeakingMessageId] = useState<
    string | null
  >(null)
  const [selectedCharacter, setSelectedCharacter] =
    useState<BrainRotCharacter | null>(null)
  const [rateLimitRefreshTrigger, setRateLimitRefreshTrigger] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Ref for the chat interface section
  const chatSectionRef = useRef<HTMLDivElement>(null)

  // Function to trigger rate limit refresh
  const refreshRateLimit = useCallback(() => {
    setRateLimitRefreshTrigger((prev) => prev + 1)
  }, [])

  // Function to generate a session ID
  const generateSessionId = useCallback(() => {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Handle character selection with smooth scrolling
  const handleCharacterSelect = useCallback(
    (character: BrainRotCharacter) => {
      setSelectedCharacter(character)

      // Generate new session ID when character changes or is first selected
      if (!sessionId || selectedCharacter?.id !== character.id) {
        setSessionId(generateSessionId())
        // Clear messages when changing character to start fresh conversation
        setMessages([])
      }

      // Smooth scroll to header separator after a brief delay to ensure the UI is updated
      setTimeout(() => {
        const headerSeparator = document.getElementById('header-separator')
        if (headerSeparator) {
          headerSeparator.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }
      }, 100)
    },
    [sessionId, selectedCharacter?.id, generateSessionId],
  )

  // Ref for background music audio element
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null)

  // Ref for current TTS audio element
  const currentTTSAudioRef = useRef<HTMLAudioElement | null>(null)

  // Ref for brain-rot notification sound
  const brainrotNotificationRef = useRef<HTMLAudioElement | null>(null)

  // Flag to track if we're intentionally stopping audio (to avoid error alerts)
  const isStoppingIntentionally = useRef<boolean>(false)

  // Initialize background music
  const initializeBackgroundMusic = () => {
    if (!backgroundMusicRef.current) {
      try {
        backgroundMusicRef.current = new Audio('/music/brain-rot.mp3')
        backgroundMusicRef.current.loop = true
        backgroundMusicRef.current.volume = 0.3 // Set to 30% volume to not overpower speech

        // Preload the audio
        backgroundMusicRef.current.preload = 'auto'

        // Add event listeners
        backgroundMusicRef.current.addEventListener('canplaythrough', () => {
          // Audio ready to play
        })

        backgroundMusicRef.current.addEventListener('error', (e) => {
          console.error('Background music failed to load:', {
            error: e.error || e.message || 'Unknown error',
            src: backgroundMusicRef.current?.src,
            readyState: backgroundMusicRef.current?.readyState,
            networkState: backgroundMusicRef.current?.networkState,
          })
        })
      } catch (error) {
        console.error('Failed to initialize background music:', error)
      }
    }
  }

  // Initialize brain-rot notification sound
  const initializeBrainRotNotification = () => {
    if (!brainrotNotificationRef.current) {
      try {
        brainrotNotificationRef.current = new Audio(
          '/music/brainrot-notification.mp3',
        )
        brainrotNotificationRef.current.volume = 0.6 // Slightly louder for notification
        brainrotNotificationRef.current.preload = 'auto'

        // Add debug logging and error handling
        brainrotNotificationRef.current.addEventListener(
          'canplaythrough',
          () => {
            console.log('Brain-rot notification sound ready to play')
          },
        )

        brainrotNotificationRef.current.addEventListener('error', (e) => {
          console.error('Brain-rot notification sound failed to load:', {
            error: e.error || e.message || 'Unknown error',
            src: brainrotNotificationRef.current?.src,
            readyState: brainrotNotificationRef.current?.readyState,
            networkState: brainrotNotificationRef.current?.networkState,
          })
        })

        brainrotNotificationRef.current.addEventListener('loadstart', () => {
          console.log('Brain-rot notification sound started loading')
        })

        brainrotNotificationRef.current.addEventListener('loadend', () => {
          console.log('Brain-rot notification sound finished loading')
        })
      } catch (error) {
        console.error('Failed to initialize brain-rot notification:', error)
      }
    }
  }

  // Play brain-rot notification sound with bizarre distortions
  const playBrainRotNotification = async () => {
    try {
      // Import the distortion system dynamically
      const { createDistortedNotification } = await import(
        '@/lib/audio-distortion'
      )

      // Create distorted notification with random chaos settings
      const chaosLevel = Math.random()
      const intensityLevel = 0.6 + Math.random() * 0.4 // 0.6 to 1.0

      const distortedNotification = await createDistortedNotification(
        '/music/brainrot-notification.mp3',
        {
          intensity: intensityLevel,
          chaos: chaosLevel,
          // Randomly enable/disable effects for maximum unpredictability
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

      // Play the distorted notification
      const source = await distortedNotification.play()

      // Clean up after playback
      source.onended = () => {
        distortedNotification.cleanup()
        console.log('Distorted brain-rot notification finished playing')
      }

      console.log(
        `Brain-rot notification played with chaos: ${chaosLevel.toFixed(2)}, intensity: ${intensityLevel.toFixed(2)}`,
      )
    } catch (error) {
      console.error('Distorted brain-rot notification failed to play:', error)

      // Fallback to original notification system
      try {
        if (!brainrotNotificationRef.current) {
          initializeBrainRotNotification()
        }

        if (brainrotNotificationRef.current) {
          // Reset to beginning and play
          brainrotNotificationRef.current.currentTime = 0
          const playPromise = brainrotNotificationRef.current.play()

          if (playPromise !== undefined) {
            await playPromise
            console.log(
              'Fallback brain-rot notification sound played successfully',
            )
          }
        }
      } catch (fallbackError) {
        console.error(
          'Both distorted and fallback notification failed:',
          fallbackError,
        )
      }
    }
  }

  const handleCloseChat = () => {
    setSelectedCharacter(null)
    setPrompt('')
    setMessages([])
    setIsLoading(false)

    // Stop all audio
    stopAllAudio()
  }

  const handleSpeakMessage = async (messageId: string) => {
    const message = messages.find((msg) => msg.id === messageId)
    if (
      !message ||
      !selectedCharacter ||
      message.type === 'error' ||
      message.type === 'user'
    )
      return

    // Stop current speech if speaking
    if (isSpeaking) {
      stopAllAudio()
      return
    }

    try {
      setIsSpeaking(true)
      setCurrentSpeakingMessageId(messageId)
      playBackgroundMusic()

      // Call our OpenAI TTS API
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message.content,
          character: selectedCharacter,
          voice: 'ash',
          instructions: `Speak as ${selectedCharacter.name} with their personality: ${selectedCharacter.description}. Use an engaging, energetic tone that matches their character.`,
          format: 'mp3',
        }),
      })

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text()
        console.error('TTS API Error:', ttsResponse.status, errorText)
        throw new Error(
          `Failed to generate speech: ${ttsResponse.status} ${errorText}`,
        )
      }

      // Get the audio data as blob
      const audioBlob = await ttsResponse.blob()

      if (audioBlob.size === 0) {
        throw new Error('Received empty audio data')
      }

      const audioUrl = URL.createObjectURL(audioBlob)

      // Create and play audio element
      const audio = new Audio(audioUrl)
      audio.setAttribute('data-tts', 'true') // Mark as TTS audio for cleanup
      audio.volume = 0.9 // Set TTS volume higher than background music
      audio.preload = 'auto'

      // Store reference to current TTS audio
      currentTTSAudioRef.current = audio

      audio.onended = () => {
        setIsSpeaking(false)
        setCurrentSpeakingMessageId(null)
        stopBackgroundMusic() // Stop background music when TTS ends
        URL.revokeObjectURL(audioUrl) // Clean up object URL
        if (currentTTSAudioRef.current === audio) {
          currentTTSAudioRef.current = null
        }
        audio.remove()
      }

      audio.onerror = () => {
        // Check if this is an intentional stop to avoid unnecessary error alerts
        if (isStoppingIntentionally.current) {
          isStoppingIntentionally.current = false // Reset flag
          return
        }

        console.error(
          'TTS Audio playback error:',
          audio.error?.message || 'Unknown audio error',
        )

        // Clean up
        setIsSpeaking(false)
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

      // Wait a bit for background music to start, then play TTS
      audio.oncanplaythrough = () => {
        // Make sure background music is still playing
        if (backgroundMusicRef.current) {
          if (backgroundMusicRef.current.paused) {
            console.log('Background music was paused, restarting...')
            playBackgroundMusic()
          } else {
            console.log('Background music is playing, starting TTS...')
          }
        }

        // Start TTS audio
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
          // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA
          audio.play().catch(() => {
            console.log('TTS audio fallback play failed')
          })
        }
      }, 500)
    } catch (error) {
      console.error('TTS Error:', error)
      setIsSpeaking(false)
      setCurrentSpeakingMessageId(null)
      stopAllAudio()
      alert('Failed to generate speech. Please try again.')
    }
  }

  // Play background music
  const playBackgroundMusic = () => {
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
  }

  // Stop background music
  const stopBackgroundMusic = () => {
    try {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause()
        backgroundMusicRef.current.currentTime = 0
      }
    } catch (error) {
      console.error('Error stopping background music:', error)
    }
  }

  // Stop all audio (TTS and background music)
  const stopAllAudio = () => {
    try {
      isStoppingIntentionally.current = true

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
  }

  // Cleanup effect for audio element
  useEffect(() => {
    // Enable audio context on first user interaction
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
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || !selectedCharacter) return

    // Stop any playing audio when starting a new request
    stopAllAudio()
    setIsSpeaking(false)
    setCurrentSpeakingMessageId(null)

    setIsLoading(true)

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentPrompt = prompt.trim()
    setPrompt('') // Clear input immediately

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentPrompt,
          character: selectedCharacter,
          threadId: sessionId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Stop any playing audio when an error occurs
        stopAllAudio()
        setIsSpeaking(false)
        setCurrentSpeakingMessageId(null)

        // Handle rate limit errors specifically
        const errorMessage =
          res.status === 429
            ? data.message || 'Rate limit exceeded. Please try again later.'
            : data.message || 'Failed to get response. Please try again.'

        const errorChatMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'error',
          content: errorMessage,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, errorChatMessage])
        return
      }

      // Add assistant response to chat
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        character: selectedCharacter,
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Play the brain-rot notification sound for new assistant responses
      playBrainRotNotification()

      // Update sessionId from response if provided
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId)
      }

      // Refresh rate limit info after successful message
      refreshRateLimit()
    } catch (error) {
      // Stop any playing audio when an error occurs
      stopAllAudio()
      setIsSpeaking(false)
      setCurrentSpeakingMessageId(null)

      console.error('Chat request failed:', error)

      const errorChatMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'error',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorChatMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <Header />

        {/* Character Selection Carousel - Only show when no character is selected */}
        {!selectedCharacter && (
          <div className="max-w-6xl mx-auto mb-12">
            <BrainRotCarousel
              characters={brainRotCharacters}
              selectedCharacter={selectedCharacter}
              onCharacterSelect={handleCharacterSelect}
            />
          </div>
        )}

        {/* Chat Interface - Only show when character is selected */}
        {selectedCharacter && (
          <div ref={chatSectionRef}>
            <ChatInterface
              selectedCharacter={selectedCharacter}
              prompt={prompt}
              setPrompt={setPrompt}
              messages={messages}
              isLoading={isLoading}
              isSpeaking={isSpeaking}
              currentSpeakingMessageId={currentSpeakingMessageId}
              onCloseChat={handleCloseChat}
              onSubmit={handleSubmit}
              onSpeakMessage={handleSpeakMessage}
              rateLimitRefreshKey={rateLimitRefreshTrigger}
            />
          </div>
        )}

        <Footer />
      </div>
    </div>
  )
}
