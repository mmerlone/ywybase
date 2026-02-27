/**
 * @fileoverview Script to generate TypeScript types from i18n translation files.
 *
 * This script reads the English translation files and generates TypeScript types
 * that match the translation keys. This provides type safety when working with
 * translations in your React components.
 *
 * @example
 * ```bash
 * # Run the script
 * pnpm run generate:i18n-types
 *
 * # Or run directly
 * npx ts-node scripts/generate-i18n-types.ts
 * ```
 *
 * @requires src/locales/en/common.json to exist as the source of truth
 * @generates src/types/generated/i18n.types.ts
 *
 * @author YwyBase Team
 * @since 1.0.0
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { safeJsonParse } from '@/lib/utils/json'
import { format } from 'prettier'

const LOCALES_PATH = join(process.cwd(), 'src/locales')
const TYPES_PATH = join(process.cwd(), 'src/types/generated/i18n.types.ts')

/**
 * Parses a JSON file with proper TypeScript typing.
 *
 * @template T - Expected type of the JSON content
 * @param {string} path - Path to the JSON file
 * @returns {T} Parsed JSON content
 *
 * @example
 * ```typescript
 * const translations = parseJsonFile<Record<string, string>>('./en/common.json');
 * ```
 */
function parseJsonFile<T = unknown>(path: string): T {
  const content = readFileSync(path, 'utf-8')
  const parsed = safeJsonParse(content)
  if (parsed === null) {
    throw new Error(`Failed to parse JSON file: ${path}`)
  }
  return parsed as T
}

/**
 * Generates TypeScript types from English translation files.
 *
 * This function:
 * 1. Reads the English translations as the source of truth
 * 2. Converts the JSON structure to TypeScript types
 * 3. Formats the output with Prettier
 * 4. Writes the generated types to the output file
 *
 * @async
 * @function generateTypes
 * @returns {Promise<void>} Promise that resolves when types are generated
 * @throws {Error} If translation files are missing or invalid
 *
 * @example
 * ```typescript
 * await generateTypes();
 * console.log('i18n types generated successfully!');
 * ```
 */
async function generateTypes(): Promise<void> {
  try {
    // Read the English translations as the source of truth
    const enTranslations = parseJsonFile<Record<string, unknown>>(join(LOCALES_PATH, 'en/common.json'))

    // Generate the type content
    const typeContent = `/**
 * Auto-generated file - DO NOT EDIT
 *
 * Last generated: ${new Date().toISOString()}
 *
 * To regenerate these types, run:
 *   pnpm run generate:i18n-types
 */

export type CommonTranslations = ${JSON.stringify(enTranslations, null, 2).replace(/"([^"]+)":/g, '$1:')};

// Re-export for i18next type augmentation
export default CommonTranslations;
`

    // Format with Prettier
    const formatted = await format(typeContent, {
      parser: 'typescript',
      singleQuote: true,
      trailingComma: 'all',
    })

    // Ensure the directory exists
    const fs = await import('fs')
    const path = await import('path')
    await fs.promises.mkdir(path.dirname(TYPES_PATH), { recursive: true })

    // Write to file
    writeFileSync(TYPES_PATH, formatted, 'utf-8')
    console.log('✅ Successfully generated i18n types')
  } catch (error) {
    console.error('❌ Error generating i18n types:', error)
    process.exit(1)
  }
}

// Run the generator
generateTypes().catch(console.error)
