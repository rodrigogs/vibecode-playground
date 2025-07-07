'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useRef } from 'react'

// Import components
import BrainRotCarousel from '@/components/BrainRotCarousel'
import CharacterFilters from '@/components/CharacterFilters'
import CharacterSearchBar from '@/components/CharacterSearchBar'
import ChatInterface from '@/components/ChatInterface'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
// Import character data and types
import charactersData from '@/data/characters.json'
// Import custom hooks
import { useAudioManager } from '@/hooks/useAudioManager'
import { useCharacterFilter } from '@/hooks/useCharacterFilter'
import { useCharacterSelection } from '@/hooks/useCharacterSelection'
import { useChat } from '@/hooks/useChat'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import type { BrainRotCharacter } from '@/types/characters'

const brainRotCharacters: BrainRotCharacter[] = (
  charactersData as { characters: BrainRotCharacter[] }
).characters.filter((character) => !character.disabled)

export default function Home() {
  const t = useTranslations('Characters')

  // Initialize custom hooks
  const { selectedCharacter, selectCharacter, clearSelection } =
    useCharacterSelection()

  const {
    searchQuery,
    popularityFilter,
    countryFilter,
    genderFilter,
    isLoadingMore,
    filteredCharacters,
    displayedCharacters,
    hasMoreCharacters,
    setSearchQuery,
    setPopularityFilter,
    setCountryFilter,
    setGenderFilter,
    loadMoreCharacters,
  } = useCharacterFilter({
    characters: brainRotCharacters,
    initialDisplayCount: 12,
    loadMoreCount: 12,
  })

  const {
    isSpeaking,
    currentSpeakingMessageId,
    isLoadingTTS,
    stopAllAudio,
    playBrainRotNotification,
    speakMessage,
  } = useAudioManager()

  const {
    prompt,
    messages,
    isLoading,
    rateLimitRefreshTrigger,
    setPrompt,
    handleSubmit,
    clearChat,
  } = useChat({
    selectedCharacter,
    onNotificationSound: playBrainRotNotification,
  })

  // Infinite scroll for character loading
  useInfiniteScroll({
    hasMore: hasMoreCharacters,
    isLoading: isLoadingMore,
    onLoadMore: loadMoreCharacters,
    threshold: 0.8,
  })

  // Ref for the chat interface section
  const chatSectionRef = useRef<HTMLDivElement>(null)

  // Handle character selection
  const handleCharacterSelect = useCallback(
    (character: BrainRotCharacter) => {
      selectCharacter(character)
      // Clear messages when changing character to start fresh conversation
      clearChat()
    },
    [selectCharacter, clearChat],
  )

  // Handle closing chat
  const handleCloseChat = useCallback(() => {
    clearSelection()
    clearChat()
    stopAllAudio()
  }, [clearSelection, clearChat, stopAllAudio])

  // Handle speaking a message
  const handleSpeakMessage = useCallback(
    async (messageId: string) => {
      const message = messages.find((msg) => msg.id === messageId)
      if (
        !message ||
        !selectedCharacter ||
        message.type === 'error' ||
        message.type === 'user'
      )
        return

      await speakMessage(messageId, message.content, selectedCharacter)
    },
    [messages, selectedCharacter, speakMessage],
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <Header />

        {/* Character Selection Carousel - Only show when no character is selected */}
        {!selectedCharacter && (
          <div className="max-w-6xl mx-auto mb-12">
            {/* Search and Filters Container */}
            <div className="mb-2 space-y-4">
              {/* Search Bar */}
              <CharacterSearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />

              {/* Character Filters */}
              <CharacterFilters
                popularityFilter={popularityFilter}
                onPopularityFilterChange={setPopularityFilter}
                countryFilter={countryFilter}
                onCountryFilterChange={setCountryFilter}
                genderFilter={genderFilter}
                onGenderFilterChange={setGenderFilter}
                className="flex justify-center"
              />

              {/* Search Results Info - Show above carousel */}
              {(searchQuery ||
                popularityFilter !== 'all' ||
                countryFilter !== 'all' ||
                genderFilter !== 'all') && (
                <div className="text-center">
                  <div className="text-sm text-white/60">
                    {filteredCharacters.length > 0
                      ? t('searchResults', {
                          count: filteredCharacters.length,
                          total: brainRotCharacters.length,
                        })
                      : t('noSearchResults')}
                  </div>
                </div>
              )}
            </div>

            {/* Character Carousel */}
            <BrainRotCarousel
              characters={displayedCharacters}
              selectedCharacter={selectedCharacter}
              onCharacterSelect={handleCharacterSelect}
              onLoadMore={loadMoreCharacters}
              hasMore={hasMoreCharacters}
              isLoading={isLoadingMore}
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
              isLoadingTTS={isLoadingTTS}
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
