import i18n, { type InitOptions, type i18n as I18nInstance } from 'i18next'

import { defaultLanguage, type Language } from './settings'

// Server-side initialization only - no React dependencies
const initServerI18n = async (lng: Language = defaultLanguage): Promise<I18nInstance> => {
  if (i18n.isInitialized) return i18n

  const options: InitOptions = {
    lng,
    fallbackLng: defaultLanguage,
    supportedLngs: ['en', 'pt-BR'],
    defaultNS: 'common',
    ns: ['common', 'landing', 'profile', 'validation'],
    interpolation: {
      escapeValue: false,
    },
    initImmediate: false,
  }

  await i18n.init(options)
  return i18n
}

// Client-side initialization with React dependencies
const initClientI18n = async (lng: Language = defaultLanguage): Promise<I18nInstance> => {
  if (typeof window === 'undefined') {
    return initServerI18n(lng)
  }

  const { default: LanguageDetector } = await import('i18next-browser-languagedetector')
  const { initReactI18next } = await import('react-i18next')

  if (i18n.isInitialized) return i18n

  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      lng,
      fallbackLng: defaultLanguage,
      supportedLngs: ['en', 'pt-BR'],
      defaultNS: 'common',
      ns: ['common', 'landing', 'profile', 'validation'],
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['path', 'cookie', 'htmlTag', 'navigator'],
        caches: ['cookie'],
      },
    })

  return i18n
}

// Export appropriate initialization function based on environment
export const initI18n = typeof window === 'undefined' ? initServerI18n : initClientI18n

export default i18n

// Re-export types for better DX
export type { TFunction } from 'i18next'
export type { Namespace } from './settings'
