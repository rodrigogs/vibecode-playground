/**
 * Merge all message sections into a single messages object
 * This function dynamically imports all JSON files from the locale-specific directory
 * and merges them into a single object that matches the original structure
 */
export async function mergeMessages(locale: string) {
  try {
    // Import all sections for the specific locale
    const [
      headerMessages,
      charactersMessages,
      chatMessages,
      footerMessages,
      authMessages,
      errorsMessages,
      legalMessages,
      aboutMessages,
      commonMessages,
    ] = await Promise.all([
      import(`./${locale}/header.json`),
      import(`./${locale}/characters.json`),
      import(`./${locale}/chat.json`),
      import(`./${locale}/footer.json`),
      import(`./${locale}/auth.json`),
      import(`./${locale}/errors.json`),
      import(`./${locale}/legal.json`),
      import(`./${locale}/about.json`),
      import(`./${locale}/common.json`),
    ])

    // Merge all sections into the expected structure
    return {
      Header: headerMessages.default,
      Characters: charactersMessages.default,
      Chat: chatMessages.default,
      Footer: footerMessages.default,
      Auth: authMessages.default,
      Errors: errorsMessages.default,
      Legal: legalMessages.default,
      About: aboutMessages.default,
      PageNavigation: commonMessages.default,
    }
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error)
    throw error
  }
}
