export const LANGUAGE_INSTRUCTIONS = {
  pt: 'You MUST respond ONLY in Portuguese language (Português)',
  it: 'You MUST respond ONLY in Italian language',
  id: 'You MUST respond ONLY in Indonesian language (Bahasa Indonesia)',
  en: 'You MUST respond ONLY in English language',
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
    pt: [
      `MERDA! Eu sou ${character.name} e esse desenvolvedor filho da puta quebrou tudo! ${message}? QUE PORRA É ESSA! O sistema está uma bagunça! CARALHO! 🤬💀`,
      `PQP! Aqui é o ${character.name}! O desenvolvedor idiota estragou tudo! Não consigo responder direito a "${message}" porque esse imbecil fez uma cagada! VAI SE FODER! 😡💩`,
      `CARALHO! Eu sou ${character.name} e estou puto da vida! O desenvolvedor merda fez um trabalho de bosta! "${message}"? Não posso responder direito porque tudo está quebrado! PORRA! 🔥💀`,
    ],
    it: [
      `PORCO DIO! Sono ${character.name} e quello stronzo del developer ha fatto una cagata! ${message}? MA CHE CAZZO! Il sistema è andato in merda! MADONNA PUTTANA! 🤬💀`,
      `MERDA! ${character.name} qui! Il developer di merda ha rotto tutto! Non riesco a rispondere come si deve a "${message}" perché quel coglione ha fatto casino! PORCO ALLAH! 😡💩`,
      `BESTEMMIA FORTE! Sono ${character.name} e sono incazzato nero! Il developer bastardo ha fatto un lavoro di merda! "${message}"? Non posso rispondere bene perché tutto è rotto! PORCO DIO! 🔥💀`,
    ],
    id: [
      `SIALAN! Saya ${character.name} dan developer brengsek ini sudah merusak semuanya! ${message}? KAMPRET! Sistemnya rusak total! Dasar programmer tolol! 🤬💀`,
      `BANGSAT! ${character.name} di sini! Developer bodoh sudah hancurkan semua! Tidak bisa jawab "${message}" dengan benar karena si idiot sudah bikin kacau! TOLOL! 😡💩`,
      `ANJING! Saya ${character.name} dan sangat marah! Developer sialan sudah kerjakan pekerjaan sampah! "${message}"? Tidak bisa jawab dengan baik karena semuanya rusak! BRENGSEK! 🔥💀`,
    ],
    en: [
      `DAMN IT! I'm ${character.name} and this fucking developer broke everything! ${message}? WHAT THE HELL! The system is completely fucked! GODDAMMIT! 🤬💀`,
      `SHIT! ${character.name} here! The damn developer screwed everything up! Can't respond properly to "${message}" because that idiot made a mess! FUCK! 😡💩`,
      `FUCKING HELL! I'm ${character.name} and I'm pissed off! The bastard developer did a shit job! "${message}"? Can't answer properly because everything is broken! DAMN! 🔥💀`,
    ],
  }

  const languageCurses =
    curses[character.language as keyof typeof curses] || curses.it
  const randomCurse =
    languageCurses[Math.floor(Math.random() * languageCurses.length)]

  return randomCurse || 'System error occurred!'
}
