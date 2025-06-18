'use client'

import { useEffect, useRef, useState } from 'react'

// Import components
import BrainRotCarousel from '@/components/BrainRotCarousel'
import ChatInterface from '@/components/ChatInterface'
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
  const [response, setResponse] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  const [selectedCharacter, setSelectedCharacter] =
    useState<BrainRotCharacter | null>(null)

  // Ref for background music audio element
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null)

  // Ref for current TTS audio element
  const currentTTSAudioRef = useRef<HTMLAudioElement | null>(null)

  // Flag to track if we're intentionally stopping audio (to avoid error alerts)
  const isStoppingIntentionally = useRef<boolean>(false)

  // Initialize background music
  const initializeBackgroundMusic = () => {
    if (!backgroundMusicRef.current) {
      backgroundMusicRef.current = new Audio('/music/brain-rot.mp3')
      backgroundMusicRef.current.loop = true
      backgroundMusicRef.current.volume = 0.3 // Set to 30% volume to not overpower speech
    }
  }

  // Play background music
  const playBackgroundMusic = () => {
    initializeBackgroundMusic()
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.play().catch((error) => {
        console.log('Background music play failed:', error)
      })
    }
  }

  // Stop background music
  const stopBackgroundMusic = () => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause()
      backgroundMusicRef.current.currentTime = 0
    }
  }

  // Stop all audio (TTS and background music)
  const stopAllAudio = () => {
    // Set flag to indicate we're intentionally stopping
    isStoppingIntentionally.current = true // Stop current TTS audio using ref
    if (currentTTSAudioRef.current) {
      const audio = currentTTSAudioRef.current
      // Remove event listeners to prevent error events during cleanup
      audio.onended = null
      audio.onerror = null

      audio.pause()
      audio.currentTime = 0
      // Only clear src if audio is not in loading state to avoid errors
      if (audio.readyState > 0 || audio.networkState === 0) {
        audio.src = ''
      }
      currentTTSAudioRef.current = null
    }

    // Stop any other TTS audio elements (fallback)
    const audioElements = document.querySelectorAll('audio[data-tts]')
    audioElements.forEach((audio) => {
      const audioElement = audio as HTMLAudioElement
      // Remove event listeners to prevent error events during cleanup
      audioElement.onended = null
      audioElement.onerror = null

      audioElement.pause()
      audioElement.currentTime = 0
      // Only clear src if audio is not in loading state to avoid errors
      if (audioElement.readyState > 0 || audioElement.networkState === 0) {
        audioElement.src = ''
      }
      audio.remove()
    })

    // Stop background music
    stopBackgroundMusic()

    setIsSpeaking(false)

    // Reset the intentional stop flag after a short delay
    setTimeout(() => {
      isStoppingIntentionally.current = false
    }, 100)
  }

  const handleCloseChat = () => {
    setSelectedCharacter(null)
    setPrompt('')
    setResponse('')
    setIsLoading(false)

    // Stop all audio
    stopAllAudio()
  }

  const handleSpeakResponse = async () => {
    if (!response || !selectedCharacter) return

    // Stop current speech if speaking
    if (isSpeaking) {
      stopAllAudio()
      return
    }

    try {
      setIsSpeaking(true)
      playBackgroundMusic()

      // Call our OpenAI TTS API
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: response,
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

      // Store reference to current TTS audio
      currentTTSAudioRef.current = audio

      audio.onended = () => {
        setIsSpeaking(false)
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

      // Start playing
      await audio.play()
    } catch (error) {
      console.error('TTS Error:', error)
      setIsSpeaking(false)
      stopAllAudio()
      alert('Failed to generate speech. Please try again.')
    }
  }

  // Cleanup effect for audio element
  useEffect(() => {
    return () => {
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

    setIsLoading(true)
    setResponse('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          character: selectedCharacter,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to get response')
      }

      const data = await res.json()
      setResponse(data.response)
    } catch {
      setResponse('Sorry, something went wrong. Please try again.')
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
              onCharacterSelect={setSelectedCharacter}
            />
          </div>
        )}

        {/* Chat Interface - Only show when character is selected */}
        {selectedCharacter && (
          <ChatInterface
            selectedCharacter={selectedCharacter}
            prompt={prompt}
            setPrompt={setPrompt}
            response={response}
            isLoading={isLoading}
            isSpeaking={isSpeaking}
            onCloseChat={handleCloseChat}
            onSubmit={handleSubmit}
            onSpeakResponse={handleSpeakResponse}
          />
        )}

        <Footer />
      </div>
    </div>
  )
}
