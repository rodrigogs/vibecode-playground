import { Loader2, Volume2, VolumeX } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { getCharacterImage } from '@/lib/characterUtils'
import type { BrainRotCharacter } from '@/types/characters'

export interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'error'
  content: string
  timestamp: Date
  character?: BrainRotCharacter
  ttsToken?: string // TTS token for audio generation (only for assistant messages)
}

interface ChatMessageProps {
  message: ChatMessage
  selectedCharacter: BrainRotCharacter
  isSpeaking: boolean
  isLoadingTTS: boolean
  onSpeakMessage: (messageId: string) => void
}

export default function ChatMessage({
  message,
  selectedCharacter,
  isSpeaking,
  isLoadingTTS,
  onSpeakMessage,
}: ChatMessageProps) {
  const t = useTranslations('Chat')

  // WhatsApp-style timestamp formatting
  const formatWhatsAppTimestamp = (timestamp: Date): string => {
    const now = new Date()
    const messageDate = new Date(timestamp)

    // Reset time to midnight for date comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const messageDay = new Date(
      messageDate.getFullYear(),
      messageDate.getMonth(),
      messageDate.getDate(),
    )

    // If message is from today, show only time
    if (messageDay.getTime() === today.getTime()) {
      return messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    }

    // If message is from yesterday
    if (messageDay.getTime() === yesterday.getTime()) {
      return 'Yesterday'
    }

    // If message is from this week (last 7 days)
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    if (messageDay.getTime() > weekAgo.getTime()) {
      return messageDate.toLocaleDateString('en-US', { weekday: 'short' })
    }

    // For older messages, show date (short format like WhatsApp)
    return messageDate.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
    })
  }

  if (message.type === 'user') {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[80%] bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-4">
          <p className="text-white leading-relaxed break-words break-anywhere">
            {message.content}
          </p>
          {/* Message Footer */}
          <div className="flex items-center justify-end mt-2">
            {/* Timestamp */}
            <span className="text-[11px] text-gray-400 opacity-80 bg-black/20 px-1.5 py-0.5 rounded">
              {formatWhatsAppTimestamp(message.timestamp)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-[80%]">
        <div
          className={`backdrop-blur-sm rounded-2xl border p-4 ${
            message.type === 'error'
              ? 'bg-red-900/20 border-red-500/20'
              : 'bg-black/20 border-green-500/20'
          }`}
        >
          {/* Character Info */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`relative w-8 h-8 rounded-full overflow-hidden ${
                message.type === 'error' ? 'bg-red-600/20' : 'bg-green-600/20'
              }`}
            >
              <Image
                src={`/images/characters/${getCharacterImage(selectedCharacter)}`}
                alt={selectedCharacter.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <h3
              className={`text-lg font-semibold flex-1 ${
                message.type === 'error' ? 'text-red-300' : 'text-green-300'
              }`}
            >
              {message.type === 'error'
                ? t('errorPrefix')
                : selectedCharacter.name}
            </h3>
          </div>

          {/* Message Content */}
          <div className="prose prose-invert max-w-none">
            <p
              className={`whitespace-pre-wrap leading-relaxed break-words break-anywhere pl-0 ${
                message.type === 'error' ? 'text-red-200' : 'text-gray-200'
              }`}
            >
              {message.content}
            </p>
          </div>

          {/* Message Footer */}
          <div className="flex items-center justify-between mt-2">
            {/* Timestamp */}
            <span className="text-[11px] text-gray-400 opacity-80 bg-black/20 px-1.5 py-0.5 rounded">
              {formatWhatsAppTimestamp(message.timestamp)}
            </span>

            {/* Audio button */}
            {message.type !== 'error' && (
              <button
                onClick={() => onSpeakMessage(message.id)}
                disabled={isLoadingTTS}
                className={`transition-all duration-200 rounded-full p-1.5 group cursor-pointer ${
                  isLoadingTTS
                    ? 'bg-yellow-500/20 border border-yellow-500/30 cursor-wait'
                    : isSpeaking
                      ? 'bg-orange-500/20 border border-orange-500/30 hover:bg-orange-500/40 hover:border-orange-500'
                      : 'bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/40 hover:border-blue-500'
                }`}
                title={
                  isLoadingTTS
                    ? t('loading')
                    : isSpeaking
                      ? t('stop')
                      : t('speak')
                }
              >
                {isLoadingTTS ? (
                  <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                ) : isSpeaking ? (
                  <VolumeX className="w-4 h-4 text-orange-400 group-hover:text-orange-300" />
                ) : (
                  <Volume2 className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
