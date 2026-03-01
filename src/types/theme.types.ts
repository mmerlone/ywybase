export type ResolvedTheme = 'dark' | 'light'

/**
 * Theme options for user interface theming preferences.
 * Defines the available theme modes that can be applied to the application.
 */
export const ThemePreferenceEnum = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const

/**
 * Type representing theme preference values.
 * Derived from ThemePreferenceEnum for type safety.
 */
export type ThemePreference = (typeof ThemePreferenceEnum)[keyof typeof ThemePreferenceEnum]
