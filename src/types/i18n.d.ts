import 'i18next'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
  }
}

export type { Language, LanguageCode } from './i18n.types'
