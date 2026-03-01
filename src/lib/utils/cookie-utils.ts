import type { CookiePreferences } from '@/types/cookie.types'

/**
 * Default cookie preferences configuration.
 * @constant
 * @type {CookiePreferences}
 * @default { necessary: true, analytics: false, marketing: false, functional: false }
 */
export const DEFAULT_COOKIE_PREFERENCES: CookiePreferences = {
  necessary: true, // Always required
  analytics: false,
  marketing: false,
  functional: false,
}

/**
 * Returns a new object containing the default cookie preferences.
 * @returns {CookiePreferences} A new object with default cookie preferences
 * @example
 * const prefs = getDefaultCookiePreferences();
 * // Returns: { necessary: true, analytics: false, marketing: false, functional: false }
 */
export const getDefaultCookiePreferences = (): CookiePreferences => ({
  ...DEFAULT_COOKIE_PREFERENCES,
})

/**
 * Merges cookie preferences with defaults and optional overrides.
 * The merging order is: defaults < base < overrides
 *
 * @param {Partial<CookiePreferences> | null} [base] - Base preferences to merge with defaults
 * @param {Partial<CookiePreferences> | null} [overrides] - Preferences that will override base and defaults
 * @returns {CookiePreferences} Merged cookie preferences
 * @example
 * const merged = mergeCookiePreferences(
 *   { analytics: true },
 *   { marketing: true }
 * );
 * // Returns: { necessary: true, analytics: true, marketing: true, functional: false }
 */
export const mergeCookiePreferences = (
  base?: Partial<CookiePreferences> | null,
  overrides?: Partial<CookiePreferences> | null
): CookiePreferences => ({
  ...DEFAULT_COOKIE_PREFERENCES,
  ...(base ?? {}),
  ...(overrides ?? {}),
})

/**
 * Ensures a cookie preferences object has all required fields with defaults.
 * If input is null or undefined, returns default preferences.
 *
 * @param {Partial<CookiePreferences> | null} [prefs] - Optional preferences to ensure
 * @returns {CookiePreferences} A complete cookie preferences object with defaults
 * @example
 * const prefs = ensureCookiePreferences({ analytics: true });
 * // Returns: { necessary: true, analytics: true, marketing: false, functional: false }
 */
export const ensureCookiePreferences = (prefs?: Partial<CookiePreferences> | null): CookiePreferences => ({
  ...DEFAULT_COOKIE_PREFERENCES,
  ...(prefs ?? {}),
})
