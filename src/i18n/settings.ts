export const languages = ['en', 'pt-BR'] as const
export type Language = (typeof languages)[number]
export const defaultLanguage: Language = 'en'
export const namespaces = ['common', 'landing', 'profile', 'validation'] as const
export type Namespace = (typeof namespaces)[number]
export const defaultNS: Namespace = 'common'

/**
 * i18n settings and utilities for the app.
 *
 * Exports the supported `languages`, `namespaces`, default values and a
 * helper `getOptions` which produces a config object consumable by
 * i18n initialization code. Types `Language` and `Namespace` are provided
 * for strong typing across the codebase.
 */

export const i18nConfig = {
  i18n: {
    defaultLocale: defaultLanguage,
    locales: [...languages],
    localeDetection: true,
  },
  ns: [...namespaces],
  defaultNS,
  keySeparator: '.',
  nsSeparator: ':',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  interpolation: {
    escapeValue: false,
  },
} as const

const scriptName = typeof process.argv[1] === 'string' ? process.argv[1] : ''
if (scriptName && import.meta.url.endsWith(scriptName)) {
  try {
    process.stdout.write(JSON.stringify({ i18nConfig }, null, 2) + '\n')
  } catch (error) {
    // Use stderr for script errors (appropriate for CLI tools)
    process.stderr.write(`Failed to output i18n config: ${error}\n`)
  }
}

export function getOptions(
  lng: Language = defaultLanguage,
  ns: Namespace | Namespace[] = defaultNS
): Record<string, unknown> & { lng: Language; ns: Namespace[] } {
  /**
   * Builds a runtime options object for i18n initialization.
   *
   * @param {Language} [lng=defaultLanguage] - Locale to use (e.g. 'en', 'pt-BR').
   * @param {Namespace|Namespace[]} [ns=defaultNS] - One or more namespaces to load.
   * @returns {Record<string, unknown> & { lng: Language; ns: Namespace[] }}
   *   The full options object combining the static `i18nConfig` with the
   *   chosen language and normalized namespace array.
   */

  return {
    ...i18nConfig,
    lng,
    ns: Array.isArray(ns) ? ns : [ns],
  }
}
