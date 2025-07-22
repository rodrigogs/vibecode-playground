#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// ES module compatibility
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Cores para o terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`
}

// Função recursiva para obter todas as chaves de um objeto
function getAllKeys(obj, prefix = '') {
  let keys = []

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key

      if (
        typeof obj[key] === 'object' &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        keys.push(fullKey)
        keys = keys.concat(getAllKeys(obj[key], fullKey))
      } else {
        keys.push(fullKey)
      }
    }
  }

  return keys
}

// Função para verificar se uma chave existe em um objeto
function hasNestedKey(obj, keyPath) {
  const keys = keyPath.split('.')
  let current = obj

  for (const key of keys) {
    if (
      current &&
      typeof current === 'object' &&
      Object.prototype.hasOwnProperty.call(current, key)
    ) {
      current = current[key]
    } else {
      return false
    }
  }

  return true
}

// Função principal
function checkI18nCompleteness() {
  // Navegamos para a pasta src/messages a partir de scripts/
  const messagesDir = path.resolve(__dirname, '..', 'src', 'messages')
  const languages = ['en', 'it', 'id', 'ja', 'zh']
  const referenceFile = path.join(messagesDir, 'pt', 'about.json')

  console.log(
    colorize('🔍 Verificação de Completude dos Arquivos i18n', 'bright'),
  )
  console.log(colorize('='.repeat(60), 'cyan'))
  console.log()

  // Carregar arquivo de referência (português)
  let referenceData
  try {
    const referenceContent = fs.readFileSync(referenceFile, 'utf8')
    referenceData = JSON.parse(referenceContent)
    console.log(colorize('📋 Arquivo de referência: pt/about.json', 'green'))
  } catch (error) {
    console.error(
      colorize(`❌ Erro ao ler arquivo de referência: ${error.message}`, 'red'),
    )
    return
  }

  // Obter todas as chaves do arquivo de referência
  const referenceKeys = getAllKeys(referenceData)
  console.log(
    colorize(
      `📊 Total de chaves no arquivo de referência: ${referenceKeys.length}`,
      'blue',
    ),
  )
  console.log()

  // Verificar cada idioma
  for (const lang of languages) {
    const langFile = path.join(messagesDir, lang, 'about.json')

    console.log(colorize(`🌐 Verificando: ${lang}/about.json`, 'bright'))
    console.log(colorize('-'.repeat(40), 'yellow'))

    try {
      const langContent = fs.readFileSync(langFile, 'utf8')
      const langData = JSON.parse(langContent)

      const langKeys = getAllKeys(langData)
      const missingKeys = []

      // Verificar quais chaves estão faltando
      for (const key of referenceKeys) {
        if (!hasNestedKey(langData, key)) {
          missingKeys.push(key)
        }
      }

      // Estatísticas
      const completenessPercentage = (
        ((referenceKeys.length - missingKeys.length) / referenceKeys.length) *
        100
      ).toFixed(1)

      console.log(
        colorize(
          `📈 Completude: ${completenessPercentage}% (${langKeys.length}/${referenceKeys.length} chaves)`,
          completenessPercentage >= 95
            ? 'green'
            : completenessPercentage >= 80
              ? 'yellow'
              : 'red',
        ),
      )

      if (missingKeys.length === 0) {
        console.log(
          colorize(
            '✅ Arquivo completo! Todas as chaves estão presentes.',
            'green',
          ),
        )
      } else {
        console.log(
          colorize(`❌ ${missingKeys.length} chaves faltando:`, 'red'),
        )

        // Agrupar chaves faltantes por seção principal
        const missingBySection = {}
        missingKeys.forEach((key) => {
          const mainSection = key.split('.')[0]
          if (!missingBySection[mainSection]) {
            missingBySection[mainSection] = []
          }
          missingBySection[mainSection].push(key)
        })

        // Mostrar chaves faltantes agrupadas por seção
        for (const [section, keys] of Object.entries(missingBySection)) {
          console.log(colorize(`   📁 ${section}:`, 'magenta'))
          keys.forEach((key) => {
            const subKey = key.replace(`${section}.`, '')
            console.log(`      • ${subKey}`)
          })
        }
      }
    } catch (error) {
      console.log(
        colorize(`❌ Erro ao processar arquivo: ${error.message}`, 'red'),
      )
    }

    console.log()
  }

  // Resumo final
  console.log(colorize('📋 RESUMO', 'bright'))
  console.log(colorize('='.repeat(60), 'cyan'))

  for (const lang of languages) {
    const langFile = path.join(messagesDir, lang, 'about.json')

    try {
      const langContent = fs.readFileSync(langFile, 'utf8')
      const langData = JSON.parse(langContent)
      const missingCount = referenceKeys.filter(
        (key) => !hasNestedKey(langData, key),
      ).length
      const completenessPercentage = (
        ((referenceKeys.length - missingCount) / referenceKeys.length) *
        100
      ).toFixed(1)

      const status =
        completenessPercentage >= 95
          ? '✅'
          : completenessPercentage >= 80
            ? '⚠️'
            : '❌'
      console.log(
        `${status} ${lang.toUpperCase()}: ${completenessPercentage}% (faltam ${missingCount} chaves)`,
      )
    } catch {
      console.log(`❌ ${lang.toUpperCase()}: Erro ao processar`)
    }
  }

  console.log()
  console.log(
    colorize(
      '💡 Para corrigir: adicione as chaves faltantes nos respectivos arquivos',
      'cyan',
    ),
  )
  console.log(colorize('📚 Referência: use pt/about.json como base', 'cyan'))
}

// Executar se o script for chamado diretamente
checkI18nCompleteness()

export { checkI18nCompleteness }
