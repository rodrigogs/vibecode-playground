import { X } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import ChatHistory from '@/components/ChatHistory'
import ChatInput from '@/components/ChatInput'
import type { ChatMessage } from '@/components/ChatMessage'
import type { BrainRotCharacter } from '@/types/characters'

interface ChatInterfaceProps {
  selectedCharacter: BrainRotCharacter
  prompt: string
  setPrompt: (value: string) => void
  messages: ChatMessage[]
  isLoading: boolean
  isSpeaking: boolean
  currentSpeakingMessageId: string | null
  onCloseChat: () => void
  onSubmit: (e: React.FormEvent) => void
  onSpeakMessage: (messageId: string) => void
  rateLimitRefreshKey?: number
}

export default function ChatInterface({
  selectedCharacter,
  prompt,
  setPrompt,
  messages,
  isLoading,
  isSpeaking,
  currentSpeakingMessageId,
  onCloseChat,
  onSubmit,
  onSpeakMessage,
  rateLimitRefreshKey,
}: ChatInterfaceProps) {
  const t = useTranslations('Chat')

  return (
    <div className="max-w-4xl mx-auto">
      {/* Chat Container */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl border border-purple-500/30 flex flex-col h-[80vh]">
        {/* Header with Character Info */}
        <div className="flex items-center gap-4 p-6 border-b border-purple-500/20">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-purple-600/20">
            <Image
              src={`/images/${selectedCharacter.image}`}
              alt={selectedCharacter.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-purple-300 mb-1">
              Chatting with: {selectedCharacter.name}
            </h3>
            <p className="text-gray-400 text-sm">
              {selectedCharacter.description}
            </p>
          </div>
          <button
            onClick={onCloseChat}
            className="ml-auto bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 hover:border-red-500 rounded-full p-2 transition-all duration-200 group cursor-pointer"
            title={t('close')}
          >
            <X className="w-6 h-6 text-red-400 group-hover:text-red-300" />
          </button>
        </div>

        {/* Chat History */}
        <ChatHistory
          messages={messages}
          selectedCharacter={selectedCharacter}
          isSpeaking={isSpeaking}
          currentSpeakingMessageId={currentSpeakingMessageId}
          onSpeakMessage={onSpeakMessage}
        />

        {/* Chat Input */}
        <ChatInput
          prompt={prompt}
          setPrompt={setPrompt}
          isLoading={isLoading}
          onSubmit={onSubmit}
          rateLimitRefreshKey={rateLimitRefreshKey}
        />
      </div>
    </div>
  )
}
