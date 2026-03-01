'use client'

import { useState, useEffect, useCallback } from 'react'

import { logger } from '@/lib/logger/client'
import { safeJsonParse } from '@/lib/utils/json'
import { ensureCookiePreferences } from '@/lib/utils/cookie-utils'
import type { CookiePreferences } from '@/types/cookie.types'

/**
 * Internal state type for cookie consent management.
 * @interface CookieConsentState
 * @internal
 */
interface CookieConsentState {
  /** Whether the user has given consent (true), denied (false), or not decided yet (null) */
  hasConsent: boolean | null
  /** Current cookie preferences for each category */
  preferences: CookiePreferences
  /** Whether the consent banner is currently visible */
  isBannerOpen: boolean
  /** Whether preferences are currently loading from localStorage */
  isLoading: boolean
}

/**
 * Key used to store cookie consent status in localStorage
 */
const COOKIE_CONSENT_KEY = 'cookie-consent'

/**
 * Key used to store cookie preferences in localStorage
 */
const COOKIE_PREFERENCES_KEY = 'cookie-preferences'

/**
 * Default cookie preferences
 * - Necessary cookies are enabled by default as they're required for basic functionality
 * - All other cookie types are disabled by default
 */
const defaultPreferences: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
}

/**
 * Return type for the useCookieConsent hook.
 * Provides cookie consent state and management functions.
 * @interface UseCookieConsentReturn
 */
type UseCookieConsentReturn = {
  /** Whether the user has given consent (true), denied (false), or not decided yet (null) */
  hasConsent: boolean | null
  /** Current cookie preferences */
  preferences: CookiePreferences
  /** Whether the consent banner is currently visible */
  isBannerOpen: boolean
  /** Whether preferences are currently loading from localStorage */
  isLoading: boolean
  /** Accept all cookie types */
  acceptAll: () => Promise<void>
  /** Accept only selected cookie types */
  acceptSelected: (prefs: Partial<CookiePreferences>) => Promise<void>
  /** Decline all non-essential cookies */
  decline: () => Promise<void>
  /** Show the cookie consent banner */
  showBanner: () => void
  /** Hide the cookie consent banner */
  hideBanner: () => void
}

/**
 * Cookie consent management hook for GDPR/privacy compliance.
 *
 * This hook manages user cookie preferences and consent state, providing a complete
 * solution for cookie consent banners and preference management. It handles localStorage
 * persistence, hydration safety, and provides methods for accepting, declining, or
 * customizing cookie preferences.
 *
 * @returns {UseCookieConsentReturn} Object containing:
 * - `hasConsent`: Current consent status (true/false/null)
 * - `preferences`: Current cookie preferences for each category
 * - `isBannerOpen`: Whether the consent banner is visible
 * - `acceptAll`: Accept all cookie categories
 * - `acceptSelected`: Accept only selected cookie categories
 * - `decline`: Decline all non-essential cookies
 * - `showBanner`: Show the consent banner
 * - `hideBanner`: Hide the consent banner
 *
 * @example
 * ```tsx
 * function CookieBanner() {
 *   const { hasConsent, acceptAll, decline, hideBanner, isBannerOpen } = useCookieConsent();
 *
 *   if (!isBannerOpen) return null;
 *
 *   return (
 *     <div className="cookie-banner">
 *       <p>This website uses cookies to enhance your experience.</p>
 *       <button onClick={acceptAll}>Accept All</button>
 *       <button onClick={decline}>Decline</button>
 *       <button onClick={hideBanner}>Customize</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function CookieSettings() {
 *   const { preferences, acceptSelected } = useCookieConsent();
 *
 *   const handleSave = (newPrefs: Partial<CookiePreferences>) => {
 *     acceptSelected(newPrefs);
 *   };
 *
 *   return (
 *     <div>
 *       <label>
 *         <input
 *           type="checkbox"
 *           checked={preferences.analytics}
 *           onChange={(e) => handleSave({ analytics: e.target.checked })}
 *         />
 *         Analytics Cookies
 *       </label>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCookieConsent(): UseCookieConsentReturn {
  const [state, setState] = useState<CookieConsentState>({
    hasConsent: null,
    preferences: { ...defaultPreferences },
    isBannerOpen: false,
    isLoading: true,
  })

  // Load actual values from localStorage after mount
  useEffect((): (() => void) | void => {
    let mounted = true

    const loadFromStorage = (): void => {
      try {
        const rawConsent = localStorage.getItem(COOKIE_CONSENT_KEY)
        const rawPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY)

        // Robust parsing: handle null, "null", "true", "false" correctly
        const parsedConsent = rawConsent !== null ? safeJsonParse(rawConsent) : null
        const hasConsent = typeof parsedConsent === 'boolean' ? parsedConsent : null

        const preferences = ((): CookiePreferences => {
          if (!rawPrefs) return { ...defaultPreferences }
          try {
            return ensureCookiePreferences(safeJsonParse(rawPrefs) as CookiePreferences)
          } catch {
            return { ...defaultPreferences }
          }
        })()

        if (mounted) {
          setState({
            hasConsent,
            preferences,
            isBannerOpen: hasConsent === null,
            isLoading: false,
          })
        }
      } catch (err) {
        logger.error({ err }, 'Error loading cookie preferences from localStorage')
        if (mounted) {
          setState((prev) => ({ ...prev, isLoading: false }))
        }
      }
    }

    loadFromStorage()
    return () => {
      mounted = false
    }
  }, [])

  const savePreferences = useCallback(async (preferences: CookiePreferences, consent: boolean): Promise<void> => {
    try {
      const validPrefs = ensureCookiePreferences(preferences)

      // Save to localStorage (client-only)
      localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(validPrefs))
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent))

      // Update state atomically
      setState({
        preferences: validPrefs,
        hasConsent: consent,
        isBannerOpen: false,
        isLoading: false,
      })

      logger.debug({ preferences: validPrefs, consent }, 'Cookie preferences saved')
    } catch (err) {
      logger.error({ err }, 'Failed to save cookie preferences')
      throw err
    }
  }, [])

  const acceptAll = useCallback(async (): Promise<void> => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    }
    await savePreferences(allAccepted, true)
  }, [savePreferences])

  // Accept selected cookie categories
  const acceptSelected = useCallback(
    async (prefs: Partial<CookiePreferences>): Promise<void> => {
      const newPreferences = {
        ...state.preferences,
        ...prefs,
        necessary: true,
      }
      await savePreferences(newPreferences, true)
    },
    [savePreferences, state.preferences]
  )

  const decline = useCallback(async (): Promise<void> => {
    await savePreferences(
      {
        necessary: true,
        functional: false,
        analytics: false,
        marketing: false,
      },
      false
    )
  }, [savePreferences])

  // Show/hide banner
  const showBanner = useCallback((): void => {
    setState((prev) => ({ ...prev, isBannerOpen: true }))
  }, [])

  const hideBanner = useCallback((): void => {
    setState((prev) => ({ ...prev, isBannerOpen: false }))
  }, [])

  return {
    ...state,
    acceptAll,
    acceptSelected,
    decline,
    showBanner,
    hideBanner,
  }
}
