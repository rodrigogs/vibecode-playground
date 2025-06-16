import { Volume2, VolumeX, X, Zap } from 'lucide-react'
import Image from 'next/image'

import type { BrainRotCharacter } from '../types/characters'

interface ChatInterfaceProps {
  selectedCharacter: BrainRotCharacter
  prompt: string
  setPrompt: (value: string) => void
  response: string
  isLoading: boolean
  isSpeaking: boolean
  onCloseChat: () => void
  onSubmit: (e: React.FormEvent) => void
  onSpeakResponse: () => void
}

export default function ChatInterface({
  selectedCharacter,
  prompt,
  setPrompt,
  response,
  isLoading,
  isSpeaking,
  onCloseChat,
  onSubmit,
  onSpeakResponse,
}: ChatInterfaceProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Combined Character Info and Chat Form */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-8 mb-8">
        {/* Character Info Header */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-purple-500/20">
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
            <p className="text-gray-400 mb-2">
              {selectedCharacter.description}
            </p>
          </div>
          <button
            onClick={onCloseChat}
            className="ml-auto bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 hover:border-red-500 rounded-full p-2 transition-all duration-200 group"
            title="Close chat and return to character selection"
          >
            <X className="w-6 h-6 text-red-400 group-hover:text-red-300" />
          </button>
        </div>

        {/* Chat Form */}
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-32 px-4 py-3 bg-black/30 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 resize-none"
              placeholder={`Type your message to ${selectedCharacter.name}...`}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {selectedCharacter.name} is thinking...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Send message to {selectedCharacter.name}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Response Area */}
      {response && (
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-green-500/20 p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-green-600/20">
              <Image
                src={`/images/${selectedCharacter.image}`}
                alt={selectedCharacter.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <h3 className="text-xl font-semibold text-green-300 flex-1">
              {selectedCharacter.name} responds:
            </h3>
            <button
              onClick={onSpeakResponse}
              className={`ml-auto transition-all duration-200 rounded-full p-2 group ${
                isSpeaking
                  ? 'bg-orange-500/20 border border-orange-500/30 hover:bg-orange-500/40 hover:border-orange-500'
                  : 'bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/40 hover:border-blue-500'
              }`}
              title={isSpeaking ? 'Stop speaking' : 'Read response aloud'}
            >
              {isSpeaking ? (
                <VolumeX className="w-5 h-5 text-orange-400 group-hover:text-orange-300" />
              ) : (
                <Volume2 className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
              )}
            </button>
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-200 whitespace-pre-wrap leading-relaxed text-lg">
              {response}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
