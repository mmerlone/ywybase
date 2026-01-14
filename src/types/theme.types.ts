export type ResolvedTheme = 'dark' | 'light'

/**
 * Theme options for user interface theming preferences.
 * Defines the available theme modes that can be applied to the application.
 */
export enum ThemePreferenceEnum {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

/**
 * Type representing theme preference values.
 * Derived from ThemePreferenceEnum for type safety.
 */
export type ThemePreference = `${ThemePreferenceEnum}`
