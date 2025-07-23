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
  const languages = ['pt', 'it', 'id', 'ja', 'zh']
  const referenceFile = path.join(messagesDir, 'en', 'about.json')

  console.log(
    colorize('🔍 Verificação de Completude dos Arquivos i18n', 'bright'),
  )
  console.log(colorize('='.repeat(60), 'cyan'))
  console.log()

  // Carregar arquivo de referência (inglês)
  let referenceData
  try {
    const referenceContent = fs.readFileSync(referenceFile, 'utf8')
    referenceData = JSON.parse(referenceContent)
    console.log(colorize('📋 Arquivo de referência: en/about.json', 'green'))
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
      const extraKeys = []

      // Verificar quais chaves estão faltando
      for (const key of referenceKeys) {
        if (!hasNestedKey(langData, key)) {
          missingKeys.push(key)
        }
      }

      // Verificar quais chaves são extras (não existem na referência)
      for (const key of langKeys) {
        if (!hasNestedKey(referenceData, key)) {
          extraKeys.push(key)
        }
      }

      const totalIssues = missingKeys.length + extraKeys.length
      const isExactMatch = totalIssues === 0

      // Estatísticas
      let completenessPercentage
      if (isExactMatch) {
        completenessPercentage = 100.0
      } else {
        // Para cálculo de porcentagem quando há discrepâncias
        const correctKeys = referenceKeys.length - missingKeys.length
        completenessPercentage = (
          (correctKeys / referenceKeys.length) *
          100
        ).toFixed(1)
      }

      console.log(
        colorize(
          `📈 Completude: ${completenessPercentage}% (${langKeys.length}/${referenceKeys.length} chaves)`,
          isExactMatch
            ? 'green'
            : completenessPercentage >= 80
              ? 'yellow'
              : 'red',
        ),
      )

      if (isExactMatch) {
        console.log(
          colorize(
            '✅ Arquivo perfeito! Estrutura idêntica ao arquivo de referência.',
            'green',
          ),
        )
      } else {
        if (missingKeys.length > 0) {
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

        if (extraKeys.length > 0) {
          console.log(
            colorize(
              `⚠️ ${extraKeys.length} chaves extras (não existem na referência):`,
              'yellow',
            ),
          )

          // Agrupar chaves extras por seção principal
          const extraBySection = {}
          extraKeys.forEach((key) => {
            const mainSection = key.split('.')[0]
            if (!extraBySection[mainSection]) {
              extraBySection[mainSection] = []
            }
            extraBySection[mainSection].push(key)
          })

          // Mostrar chaves extras agrupadas por seção
          for (const [section, keys] of Object.entries(extraBySection)) {
            console.log(colorize(`   📁 ${section}:`, 'cyan'))
            keys.forEach((key) => {
              const subKey = key.replace(`${section}.`, '')
              console.log(`      + ${subKey}`)
            })
          }
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
      const langKeys = getAllKeys(langData)

      const missingCount = referenceKeys.filter(
        (key) => !hasNestedKey(langData, key),
      ).length

      const extraCount = langKeys.filter(
        (key) => !hasNestedKey(referenceData, key),
      ).length

      const totalIssues = missingCount + extraCount
      const isExactMatch = totalIssues === 0

      let completenessPercentage
      if (isExactMatch) {
        completenessPercentage = 100.0
      } else {
        const correctKeys = referenceKeys.length - missingCount
        completenessPercentage = (
          (correctKeys / referenceKeys.length) *
          100
        ).toFixed(1)
      }

      const status = isExactMatch ? '✅' : totalIssues <= 5 ? '⚠️' : '❌'

      if (isExactMatch) {
        console.log(
          `${status} ${lang.toUpperCase()}: ${completenessPercentage}% (estrutura idêntica)`,
        )
      } else {
        const issues = []
        if (missingCount > 0) issues.push(`${missingCount} faltando`)
        if (extraCount > 0) issues.push(`${extraCount} extras`)

        console.log(
          `${status} ${lang.toUpperCase()}: ${completenessPercentage}% (${issues.join(', ')})`,
        )
      }
    } catch {
      console.log(`❌ ${lang.toUpperCase()}: Erro ao processar`)
    }
  }

  console.log()
  console.log(
    colorize(
      '💡 Para corrigir: adicione chaves faltantes e remova chaves extras',
      'cyan',
    ),
  )
  console.log(colorize('📚 Referência: use en/about.json como base', 'cyan'))
}

// Executar se o script for chamado diretamente
checkI18nCompleteness()

export { checkI18nCompleteness }
