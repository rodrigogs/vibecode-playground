'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'

import type { ChatMessage } from '@/components/ChatMessage'
import { useFingerprint } from '@/hooks/useFingerprint'
import type { BrainRotCharacter } from '@/types/characters'

export interface UseChatReturn {
  // State
  prompt: string
  messages: ChatMessage[]
  isLoading: boolean
  sessionId: string | null
  rateLimitRefreshTrigger: number
  // Actions
  setPrompt: (prompt: string) => void
  setMessages: (
    messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[]),
  ) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
  clearChat: () => void
  refreshRateLimit: () => void
  generateSessionId: () => string
}

interface UseChatProps {
  selectedCharacter: BrainRotCharacter | null
  onNotificationSound?: () => Promise<void>
}

export function useChat({
  selectedCharacter,
  onNotificationSound,
}: UseChatProps): UseChatReturn {
  const t = useTranslations('Errors.chat')

  // Browser fingerprinting for enhanced rate limiting
  const { fingerprint } = useFingerprint()

  // State
  const [prompt, setPrompt] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [rateLimitRefreshTrigger, setRateLimitRefreshTrigger] = useState(0)

  // Function to generate a session ID
  const generateSessionId = useCallback(() => {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Function to trigger rate limit refresh
  const refreshRateLimit = useCallback(() => {
    setRateLimitRefreshTrigger((prev) => prev + 1)
  }, [])

  // Clear chat function
  const clearChat = useCallback(() => {
    setPrompt('')
    setMessages([])
    setIsLoading(false)
  }, [])

  // Handle chat submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!prompt.trim() || !selectedCharacter) return

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
            threadId: sessionId, // Send threadId for conversation continuity
            fingerprint, // Include browser fingerprint for enhanced rate limiting
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          // Handle rate limit errors specifically
          const errorMessage =
            res.status === 429
              ? data.message || t('rateLimitExceeded')
              : data.message || t('requestFailed')

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
          ttsToken: data.ttsToken, // Store the TTS token from the chat response
        }

        setMessages((prev) => [...prev, assistantMessage])

        // Play the brain-rot notification sound for new assistant responses
        if (onNotificationSound) {
          onNotificationSound()
        }

        // Update sessionId from response if provided
        if (data.threadId && data.threadId !== sessionId) {
          setSessionId(data.threadId)
        }

        // Refresh rate limit info after successful message
        refreshRateLimit()
      } catch (error) {
        console.error('Chat request failed:', error)

        const errorChatMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'error',
          content: t('unexpectedError'),
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, errorChatMessage])
      } finally {
        setIsLoading(false)
      }
    },
    [
      prompt,
      selectedCharacter,
      sessionId,
      fingerprint,
      onNotificationSound,
      refreshRateLimit,
      t,
    ],
  )

  return {
    // State
    prompt,
    messages,
    isLoading,
    sessionId,
    rateLimitRefreshTrigger,
    // Actions
    setPrompt,
    setMessages,
    handleSubmit,
    clearChat,
    refreshRateLimit,
    generateSessionId,
  }
}
