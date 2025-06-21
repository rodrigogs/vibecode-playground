import { useEffect, useRef } from 'react'

import ChatMessage, {
  type ChatMessage as ChatMessageType,
} from '@/components/ChatMessage'
import type { BrainRotCharacter } from '@/types/characters'

interface ChatHistoryProps {
  messages: ChatMessageType[]
  selectedCharacter: BrainRotCharacter
  isSpeaking: boolean
  currentSpeakingMessageId: string | null
  isLoadingTTS: boolean
  onSpeakMessage: (messageId: string) => void
}

export default function ChatHistory({
  messages,
  selectedCharacter,
  isSpeaking,
  currentSpeakingMessageId,
  isLoadingTTS,
  onSpeakMessage,
}: ChatHistoryProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <p>Start a conversation with {selectedCharacter.name}!</p>
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
      <div ref={messagesEndRef} />
    </div>
  )
}
