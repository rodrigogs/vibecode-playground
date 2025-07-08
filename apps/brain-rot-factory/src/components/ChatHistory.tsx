import Image from 'next/image'
import { useEffect, useRef } from 'react'

import ChatMessage, {
  type ChatMessage as ChatMessageType,
} from '@/components/ChatMessage'
import { getCharacterImage } from '@/lib/characterUtils'
import type { BrainRotCharacter } from '@/types/characters'

interface ChatHistoryProps {
  messages: ChatMessageType[]
  selectedCharacter: BrainRotCharacter
  isSpeaking: boolean
  currentSpeakingMessageId: string | null
  isLoadingTTS: boolean
  isLoading?: boolean // AI is generating response
  onSpeakMessage: (messageId: string) => void
}

export default function ChatHistory({
  messages,
  selectedCharacter,
  isSpeaking,
  currentSpeakingMessageId,
  isLoadingTTS,
  isLoading = false,
  onSpeakMessage,
}: ChatHistoryProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        {/* Modern Floating Orbs Animation */}
        <div className="relative flex items-center justify-center">
          {/* Background glow */}
          <div
            className="absolute inset-0 w-32 h-32 bg-gradient-to-r from-purple-400/5 to-pink-400/5 rounded-full blur-2xl animate-pulse"
            style={{ animationDuration: '3s' }}
          ></div>

          {/* Main floating orbs container */}
          <div className="relative flex items-center space-x-2">
            {/* Orb 1 */}
            <div className="w-3 h-3 bg-gradient-to-br from-purple-400/10 to-purple-500/10 backdrop-blur-sm rounded-full border border-white/5 shadow-lg animate-bounce"></div>

            {/* Orb 2 */}
            <div className="w-4 h-4 bg-gradient-to-br from-purple-500/5 to-pink-500/5 backdrop-blur-sm rounded-full border border-white/10 shadow-lg animate-bounce delay-200"></div>

            {/* Orb 3 */}
            <div className="w-3 h-3 bg-gradient-to-br from-pink-400/10 to-pink-500/10 backdrop-blur-sm rounded-full border border-white/5 shadow-lg animate-bounce delay-400"></div>
          </div>

          {/* Floating accent particles */}
          <div className="absolute -top-8 left-4 w-2 h-2 bg-purple-300/15 rounded-full animate-ping delay-1000"></div>
          <div className="absolute -bottom-8 right-4 w-1.5 h-1.5 bg-pink-300/15 rounded-full animate-ping delay-1500"></div>
          <div className="absolute top-6 -left-8 w-1 h-1 bg-blue-300/20 rounded-full animate-ping delay-2000"></div>
          <div className="absolute bottom-6 -right-8 w-1 h-1 bg-purple-200/20 rounded-full animate-ping delay-2500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[60vh]">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          selectedCharacter={selectedCharacter}
          isSpeaking={isSpeaking && currentSpeakingMessageId === message.id}
          isLoadingTTS={isLoadingTTS && currentSpeakingMessageId === message.id}
          onSpeakMessage={onSpeakMessage}
        />
      ))}

      {/* AI Typing Indicator */}
      {isLoading && (
        <div className="flex items-start space-x-3 animate-fade-in">
          {/* Character Avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden bg-green-600/20 flex-shrink-0 relative">
            <Image
              src={`/images/characters/${getCharacterImage(selectedCharacter)}`}
              alt={selectedCharacter.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Typing Bubble */}
          <div className="bg-black/20 backdrop-blur-sm border border-green-500/20 rounded-2xl rounded-bl-sm p-4 max-w-xs">
            <div className="flex items-center space-x-1">
              {/* Typing dots */}
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-200"></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-400"></div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
