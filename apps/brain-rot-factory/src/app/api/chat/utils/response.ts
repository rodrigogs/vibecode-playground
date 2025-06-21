import type { BrainRotCharacter } from '@/types/characters'

export function generateMockResponse(
  character: BrainRotCharacter,
  message: string,
): string {
  // Language-specific responses based on character.language
  const responses: Record<string, string[]> = {
    'tralalero': [
      `Trallallero, trallallà! Ma che cazzo mi stai dicendo? ${message.toLowerCase().includes('ciao') ? 'Ciao un cazzo! Qui si bestemmia!' : 'Madonna boia, non ci capisco niente!'} Sai che ti dico? Una volta mio figlio Merdardo mi ha detto la stessa merda e io gli ho risposto con una bestemmia così forte che anche Burger si è cagato addosso! PORCO DIO! 🤬`,

      `TRALLALLERO TRALLALLÀ! Ma sei scemo o cosa? ${message.includes('?') ? 'Non fare domande del cazzo!' : 'Non dire stronzate!'} Ti racconto una storia veloce: ero con Ornella Leccacappella quando è arrivato quel bastardo di Burger a fare casini. Gli ho tirato il mio cazzo in faccia e lui è scappato piangendo come un bambino! Ahahahah che sfigato! PORCO ALLAH! 🤣`,
    ],

    'tung-sahur': [
      `TUNG TUNG TUNG TUNG SAHUR! ${message.toUpperCase()} TUNG TUNG TUNG! Tidak bisa berhenti membuat suara ini! SAHUR SAHUR TUNG TUNG TUNG! Pesan kamu mengaktifkan ritme otak saya! TUNG TUNG SAHUR TUNG TUNG! 🎵💀`,

      'SAHUR SAHUR SAHUR! TUNG TUNG TUNG! Otak saya hanya berfungsi dengan ritme TUNG TUNG TUNG SAHUR! Tidak bisa berhenti! TUNG TUNG TUNG! Hiii, seramnya! 🔥🎵',
    ],

    'bombardiro-crocodilo': [
      `BOOM BOOM BOMBARDIRO! Un fottuto alligatore volante che vola e bombarda! ${message.toLowerCase().includes('guerra') ? 'Sì, amo la guerra!' : 'BOMBARDIRO CROCODILO!'} Il mio corpo è una fusione tra coccodrillo e bombardiere! BOOM BOOM! 💥🐊`,

      `BOMBARDIRO CROCODILO! Volo nei cieli seminando distruzione! ${message.includes('?') ? 'Domande? Io rispondo solo con le bombe!' : 'BOOM BOOM BOMBARDIRO!'} Non credo in Allah e amo le bombe! DISTRUZIONE DALL'ALTO! 🛩️💣`,
    ],

    'boneca-ambalabu': [
      `Boneca Ambalabu! Entitas jahat yang mengganggu masyarakat! ${message.toLowerCase().includes('takut') ? 'Ya, kamu harus takut!' : 'Saya membuat bingung semua ilmuwan!'} Professor Rusdi sudah meneliti saya tapi tidak ada yang bisa memahami! Saya sangat misterius! 🐸🛞`,

      `BONECA AMBALABU! Mengacaukan semua situasi di mana pun saya pergi! ${message.includes('?') ? 'Pertanyaan? Saya tidak pernah memberikan jawaban yang jelas!' : 'Chaos dan kekacauan adalah keahlian saya!'} Tidak ada yang bisa mengerti saya! 👾🌀`,
    ],

    'lirili-larila': [
      `Lirilí Larilà! Elefante nel deserto che cammina qua e là! ${message.toLowerCase().includes('tempo') ? 'Il tempo è una cosa che va, tic tac!' : "Con la mia conchiglia e l'orologio!"} Le spine del cactus mi fanno un attacco flashback! Tic tac, tic tac! 🐘🌵`,

      `LIRILÍ LARILÀ! Il mio orologio magico controlla il tempo! ${message.includes('?') ? 'Domande? Il tempo risponde per me!' : 'Arriva zio Ramon con una mongolfiera blu!'} Tic tac, il tempo va e viene! 🕐🎈`,
    ],

    'brr-brr-patapim': [
      `Brr, brr, Patapim! Il mio cappello è pieno di Slim! ${message.toLowerCase().includes('bosco') ? 'Sì, vivo nel bosco fitto!' : 'Nel bosco misterioso!'} Con radici intrecciate e gambe incrociate! Brr brr Patapim! 🐒🌳`,

      `BRR BRR PATAPIM! Guardiano della foresta! ${message.includes('?') ? 'Domande? Il bosco sussurra le risposte!' : 'Brr brr, che freddo!'} Il mio naso lungo come un prosciutto! Patapim nel vento! 🍃🧢`,
    ],

    'chimpanzini-bananini': [
      `Chimpanzini Bananini! Wah! Wah! Wah! ${message.toLowerCase().includes('banana') ? 'Bananuchi, monkey monkey!' : 'Monkey, monkey, monkey, uci!'} Sono uno scimpanzé verde dentro una banana! Wah wah wah! 🐵🍌`,

      `WAH WAH WAH! Bananuchi! ${message.includes('?') ? 'Monkey monkey domande monkey!' : 'Monkey, monkey, monkey, uci!'} Se togli la banana scopri i miei muscoli! CHIMPANZINI BANANINI! 💪🍌`,
    ],

    'capuccino-assassino': [
      `Capu capu cappuccino! Assassino assassini! ${message.toLowerCase().includes('caffè') ? 'Bravo, ami il caffè!' : 'Odio chi non beve caffè!'} Sono un killer del cappuccino! Capu capu! ☕🗡️`,

      `CAPPUCCINO ASSASSINO! ${message.includes('?') ? 'Domande? Il caffè ha tutte le risposte!' : 'Capu capu assassini!'} Attento, sono sposato con Ballerina Cappuccina! La velocità del caffè! ⚡☕`,
    ],
  }

  // Get character-specific responses or create language-appropriate fallback
  const characterResponses = responses[character.id as keyof typeof responses]

  if (!characterResponses) {
    // Create fallback response in character's language
    const fallback =
      character.language === 'id'
        ? `Saya adalah ${character.name}! Pesan kamu: "${message}" sangat menarik! ${character.catchphrases?.[0] || 'Terima kasih sudah berbicara dengan saya!'} 😊`
        : character.language === 'en'
          ? `I am ${character.name}! Your message: "${message}" is very interesting! ${character.catchphrases?.[0] || 'Thanks for talking to me!'} 😊`
          : `Sono ${character.name}! Il tuo messaggio: "${message}" è molto interessante! ${character.catchphrases?.[0] || 'Grazie per aver parlato con me!'} 😊`

    return fallback
  }

  const randomResponse =
    characterResponses[Math.floor(Math.random() * characterResponses.length)]

  return randomResponse || 'Error generating response!'
}
