import { X } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import ChatHistory from '@/components/ChatHistory'
import ChatInput from '@/components/ChatInput'
import type { ChatMessage } from '@/components/ChatMessage'
import { getCharacterImage } from '@/lib/characterUtils'
import type { BrainRotCharacter } from '@/types/characters'

interface ChatInterfaceProps {
  selectedCharacter: BrainRotCharacter
  prompt: string
  setPrompt: (value: string) => void
  messages: ChatMessage[]
  isLoading: boolean
  isSpeaking: boolean
  currentSpeakingMessageId: string | null
  isLoadingTTS: boolean
  onCloseChat: () => void
  onSubmit: (e: React.FormEvent) => void
  onSpeakMessage: (messageId: string) => void
  rateLimitRefreshKey?: number
  onRateLimitRefresh?: () => void
}

export default function ChatInterface({
  selectedCharacter,
  prompt,
  setPrompt,
  messages,
  isLoading,
  isSpeaking,
  currentSpeakingMessageId,
  isLoadingTTS,
  onCloseChat,
  onSubmit,
  onSpeakMessage,
  rateLimitRefreshKey,
  onRateLimitRefresh,
}: ChatInterfaceProps) {
  const t = useTranslations('Chat')
  const [showImageModal, setShowImageModal] = useState(false)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Image Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-2xl max-h-[90vh] rounded-xl overflow-hidden">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <Image
              src={`/images/characters/${getCharacterImage(selectedCharacter)}`}
              alt={selectedCharacter.name}
              width={800}
              height={800}
              className="object-contain max-w-full max-h-full"
              unoptimized
            />
          </div>
        </div>
      )}
      {/* Chat Container */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl border border-purple-500/30 flex flex-col h-[85vh]">
        {/* Header with Character Info */}
        <div className="relative p-4 sm:p-6 border-b border-purple-500/20">
          {/* Mobile Layout */}
          <div className="sm:hidden">
            {/* Close Button - Positioned Absolutely */}
            <button
              onClick={onCloseChat}
              className="absolute top-4 right-4 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 hover:border-red-500 rounded-full p-2 transition-all duration-200 group cursor-pointer z-10"
              title={t('close')}
            >
              <X className="w-5 h-5 text-red-400 group-hover:text-red-300" />
            </button>

            {/* Centered Content Layout */}
            <div className="flex flex-col items-center text-center space-y-3 px-8">
              {/* Avatar */}
              <button
                onClick={() => setShowImageModal(true)}
                className="relative w-16 h-16 rounded-full overflow-hidden bg-purple-600/20 hover:bg-purple-600/30 transition-colors cursor-pointer group flex-shrink-0"
                title="View character image"
              >
                <Image
                  src={`/images/characters/${getCharacterImage(selectedCharacter)}`}
                  alt={selectedCharacter.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  unoptimized
                />
              </button>

              {/* Text Content */}
              <div className="space-y-2 text-center w-full max-w-xs">
                <div className="text-purple-200 text-sm font-medium">
                  Chatting with:
                </div>
                <h3
                  className="text-lg font-bold text-white leading-tight w-full"
                  style={{
                    wordBreak: 'break-all',
                    overflowWrap: 'anywhere',
                    hyphens: 'auto',
                  }}
                >
                  {selectedCharacter.name}
                </h3>
                <p className="text-gray-400 text-xs line-clamp-2 leading-tight w-full">
                  {selectedCharacter.description.length > 60
                    ? `${selectedCharacter.description.slice(0, 60)}...`
                    : selectedCharacter.description}
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center gap-4">
            <button
              onClick={() => setShowImageModal(true)}
              className="relative w-16 h-16 rounded-full overflow-hidden bg-purple-600/20 hover:bg-purple-600/30 transition-colors cursor-pointer group flex-shrink-0"
              title="View character image"
            >
              <Image
                src={`/images/characters/${getCharacterImage(selectedCharacter)}`}
                alt={selectedCharacter.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
                unoptimized
              />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-purple-300 mb-1">
                Chatting with:{' '}
                <span className="break-words">{selectedCharacter.name}</span>
              </h3>
              <p className="text-gray-400 text-sm">
                {selectedCharacter.description}
              </p>
            </div>
            <button
              onClick={onCloseChat}
              className="bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 hover:border-red-500 rounded-full p-2 transition-all duration-200 group cursor-pointer"
              title={t('close')}
            >
              <X className="w-6 h-6 text-red-400 group-hover:text-red-300" />
            </button>
          </div>
        </div>

        {/* Chat History */}
        <ChatHistory
          messages={messages}
          selectedCharacter={selectedCharacter}
          isSpeaking={isSpeaking}
          currentSpeakingMessageId={currentSpeakingMessageId}
          isLoadingTTS={isLoadingTTS}
          isLoading={isLoading}
          onSpeakMessage={onSpeakMessage}
        />

        {/* Chat Input */}
        <ChatInput
          prompt={prompt}
          setPrompt={setPrompt}
          isLoading={isLoading}
          onSubmit={onSubmit}
          rateLimitRefreshKey={rateLimitRefreshKey}
          onRateLimitRefresh={onRateLimitRefresh}
        />
      </div>
    </div>
  )
}
