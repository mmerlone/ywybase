/**
 * Internationalization (i18n) Types
 *
 * Type definitions for language support and internationalization.
 * Provides language codes, metadata, and configuration types.
 */

/**
 * Array of all supported languages with their metadata.
 * Generated dynamically from the Intl API's supported collation values.
 *
 * @remarks
 * Each language object contains:
 * - code: The language/locale code (e.g., 'en', 'pt-BR')
 * - name: Display name in the current locale
 * - nativeName: Display name in the language's native form
 *
 * Falls back to the language code if display name retrieval fails.
 *
 * @example
 * ```typescript
 * // Find a specific language
 * const english = SUPPORTED_LANGUAGES.find(lang => lang.code === 'en');
 * // Returns: { code: 'en', name: 'English', nativeName: 'English' }
 * ```
 */
export const SUPPORTED_LANGUAGES = Intl.supportedValuesOf('collation').map((code) => {
  try {
    const displayName = new Intl.DisplayNames([code], { type: 'language' }).of(code)
    return {
      code,
      name: displayName ?? code,
      nativeName: displayName ?? code,
    }
  } catch {
    return { code, name: code, nativeName: code }
  }
})

/**
 * Type representing a supported language code.
 * Derived from the SUPPORTED_LANGUAGES array for type safety.
 *
 * @example
 * ```typescript
 * const userLanguage: LanguageCode = { code: 'en', name: 'English', nativeName: 'English' };
 * ```
 */
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]

/**
 * Complete language metadata including display information.
 * Used for language selection UI and internationalization configuration.
 *
 * @example
 * ```typescript
 * const language: Language = {
 *   code: { code: 'en', name: 'English', nativeName: 'English' },
 *   name: 'English',
 *   nativeName: 'English',
 *   flag: '🇺🇸'
 * };
 * ```
 */
export interface Language {
  /** Language/locale code object */
  code: LanguageCode
  /** Display name of the language in the current locale */
  name: string
  /** Display name of the language in its native form */
  nativeName: string
  /** Flag emoji or icon representing the language/country */
  flag: string
}
