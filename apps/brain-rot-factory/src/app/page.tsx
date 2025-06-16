'use client'

import { useRef, useState } from 'react'

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

  // Use a ref to track stopping state for immediate access in callbacks
  const isStoppingSpeechRef = useRef<boolean>(false)

  const handleCloseChat = () => {
    setSelectedCharacter(null)
    setPrompt('')
    setResponse('')
    setIsLoading(false)
    // Stop any ongoing speech
    if (window.speechSynthesis.speaking) {
      isStoppingSpeechRef.current = true
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const handleSpeakResponse = () => {
    if (!response || !selectedCharacter) return

    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.')
      return
    }

    // Stop current speech if speaking
    if (window.speechSynthesis.speaking) {
      isStoppingSpeechRef.current = true
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    // Create new speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(response)

    // Configure voice settings
    utterance.rate = 0.9 // Slightly slower for better understanding
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Try to use an Italian voice if available
    const voices = window.speechSynthesis.getVoices()
    console.log('Available voices:', voices)
    const italianVoice = voices.find(
      (voice) =>
        voice.lang.startsWith('it') ||
        voice.name.toLowerCase().includes('italian'),
    )

    if (italianVoice) {
      utterance.voice = italianVoice
    }

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true)
      isStoppingSpeechRef.current = false
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      isStoppingSpeechRef.current = false
    }

    utterance.onerror = () => {
      setIsSpeaking(false)
      // Only show error if we're not intentionally stopping
      if (!isStoppingSpeechRef.current) {
        alert('Error occurred during text-to-speech.')
      }
      isStoppingSpeechRef.current = false
    }

    // Start speaking
    window.speechSynthesis.speak(utterance)
  }

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
