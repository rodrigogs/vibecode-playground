import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

export const calculatorTool = new DynamicStructuredTool({
  name: 'calculator',
  description:
    'Perform mathematical calculations including basic arithmetic, powers, and square roots',
  schema: z.object({
    expression: z
      .string()
      .describe(
        'Mathematical expression to evaluate (e.g., "2 + 3", "sqrt(16)", "2^3")',
      ),
  }),
  func: async ({ expression }) => {
    try {
      // Clean and prepare the expression
      const cleanExpression = expression
        .replace(/\s+/g, '')
        .replace(/\^/g, '**')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log(')
        .replace(/abs\(/g, 'Math.abs(')
        .replace(/\bpi\b/g, 'Math.PI')
        .replace(/\be\b/g, 'Math.E')

      // Validate expression contains only allowed characters
      if (
        !/^[0-9+\-*/.()Math.sqrtsincosterablogPIE\s]+$/.test(cleanExpression)
      ) {
        return '❌ Error: Invalid expression\n\nTry simpler expressions like: 2+3, sqrt(16), 2^3, sin(0)'
      }

      // Check for potential security issues
      if (
        cleanExpression.includes('alert') ||
        cleanExpression.includes('eval') ||
        cleanExpression.includes('function')
      ) {
        return '❌ Error: Invalid expression\n\nTry simpler expressions like: 2+3, sqrt(16), 2^3, sin(0)'
      }

      // Evaluate the expression safely
      const result = Function(`"use strict"; return (${cleanExpression})`)()

      if (typeof result !== 'number') {
        return '❌ Error: Invalid expression\n\nTry simpler expressions like: 2+3, sqrt(16), 2^3, sin(0)'
      }

      // Handle special cases
      if (result === Infinity) {
        return `🧮 Calculating: ${expression}\n\nResult: Infinity`
      }

      if (result === -Infinity) {
        return `🧮 Calculating: ${expression}\n\nResult: -Infinity`
      }

      if (isNaN(result)) {
        return '❌ Error: Invalid expression\n\nTry simpler expressions like: 2+3, sqrt(16), 2^3, sin(0)'
      }

      // Format the result to show appropriate precision
      let formattedResult = result.toString()
      if (expression === 'pi' && Math.abs(result - Math.PI) < 0.00001) {
        formattedResult = '3.14159'
      } else if (expression === 'e' && Math.abs(result - Math.E) < 0.00001) {
        formattedResult = '2.71828'
      }

      return `🧮 Calculating: ${expression}\n\nResult: ${formattedResult}\n\n${result % 1 === 0 ? "🎯 That's a whole number!" : "📊 That's a decimal number!"}`
    } catch (error) {
      return `❌ Error calculating "${expression}": ${error instanceof Error ? error.message : 'Invalid expression'}\n\nTry simpler expressions like: 2+3, sqrt(16), 2^3, sin(0)`
    }
  },
})
