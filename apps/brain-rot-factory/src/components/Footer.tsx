import { Sparkles } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-12">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600/10 to-pink-600/10 backdrop-blur-sm border border-purple-500/20 rounded-full px-6 py-3">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="text-sm font-medium bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            100% Vibe Coded ✨ No Planning, Pure Energy
          </span>
          <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
        </div>
      </div>
    </footer>
  )
}
