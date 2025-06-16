export const LANGUAGE_INSTRUCTIONS = {
  italian: 'You MUST respond ONLY in Italian language',
  indonesian: 'You MUST respond ONLY in Indonesian language (Bahasa Indonesia)',
  english: 'You MUST respond ONLY in English language',
} as const

export function getLanguageInstruction(language: string): string {
  return (
    LANGUAGE_INSTRUCTIONS[language as keyof typeof LANGUAGE_INSTRUCTIONS] ||
    'You MUST respond ONLY in Italian language'
  )
}

export function generateDeveloperCurseResponse(
  character: { name: string; language: string; catchphrases?: string[] },
  message: string,
): string {
  const curses = {
    italian: [
      `PORCO DIO! Sono ${character.name} e quello stronzo del developer ha fatto una cagata! ${message}? MA CHE CAZZO! Il sistema è andato in merda! MADONNA PUTTANA! 🤬💀`,
      `MERDA! ${character.name} qui! Il developer di merda ha rotto tutto! Non riesco a rispondere come si deve a "${message}" perché quel coglione ha fatto casino! PORCO ALLAH! 😡💩`,
      `BESTEMMIA FORTE! Sono ${character.name} e sono incazzato nero! Il developer bastardo ha fatto un lavoro di merda! "${message}"? Non posso rispondere bene perché tutto è rotto! PORCO DIO! 🔥💀`,
    ],
    indonesian: [
      `SIALAN! Saya ${character.name} dan developer brengsek ini sudah merusak semuanya! ${message}? KAMPRET! Sistemnya rusak total! Dasar programmer tolol! 🤬💀`,
      `BANGSAT! ${character.name} di sini! Developer bodoh sudah hancurkan semua! Tidak bisa jawab "${message}" dengan benar karena si idiot sudah bikin kacau! TOLOL! 😡💩`,
      `ANJING! Saya ${character.name} dan sangat marah! Developer sialan sudah kerjakan pekerjaan sampah! "${message}"? Tidak bisa jawab dengan baik karena semuanya rusak! BRENGSEK! 🔥💀`,
    ],
    english: [
      `DAMN IT! I'm ${character.name} and this fucking developer broke everything! ${message}? WHAT THE HELL! The system is completely fucked! GODDAMMIT! 🤬💀`,
      `SHIT! ${character.name} here! The damn developer screwed everything up! Can't respond properly to "${message}" because that idiot made a mess! FUCK! 😡💩`,
      `FUCKING HELL! I'm ${character.name} and I'm pissed off! The bastard developer did a shit job! "${message}"? Can't answer properly because everything is broken! DAMN! 🔥💀`,
    ],
  }

  const languageCurses =
    curses[character.language as keyof typeof curses] || curses.italian
  const randomCurse =
    languageCurses[Math.floor(Math.random() * languageCurses.length)]

  return randomCurse || 'System error occurred!'
}
