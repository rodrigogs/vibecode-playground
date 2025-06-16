import Image from 'next/image'

export default function Header() {
  return (
    <header className="text-center py-6">
      <div className="relative flex items-center justify-center mb-12">
        <Image
          src="/images/logo.png"
          alt="Brain Rot Factory Logo"
          width={150}
          height={150}
          className="absolute opacity-80 z-0"
          unoptimized
        />
        <h1 className="relative z-10 text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Brain Rot Factory
        </h1>
      </div>
      <p className="text-xl text-gray-300 max-w-2xl mx-auto">
        Select a character below to start chatting with AI-powered Italian brain
        rot personalities! 🧠💬
      </p>
    </header>
  )
}
