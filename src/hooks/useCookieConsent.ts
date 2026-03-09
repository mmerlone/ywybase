'use client'

import { useReducer, useEffect, useCallback } from 'react'

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
  /** 'loading' until localStorage has been read on the client; 'ready' after */
  status: 'loading' | 'ready'
}

type CookieConsentAction =
  | { type: 'INIT'; hasConsent: boolean | null; preferences: CookiePreferences }
  | { type: 'SAVE'; hasConsent: boolean; preferences: CookiePreferences }
  | { type: 'SHOW_BANNER' }
  | { type: 'HIDE_BANNER' }

function cookieConsentReducer(state: CookieConsentState, action: CookieConsentAction): CookieConsentState {
  switch (action.type) {
    case 'INIT':
      return {
        status: 'ready',
        hasConsent: action.hasConsent,
        preferences: action.preferences,
        // Show banner only when consent has not been given yet
        isBannerOpen: action.hasConsent === null,
      }
    case 'SAVE':
      return {
        status: 'ready',
        hasConsent: action.hasConsent,
        preferences: action.preferences,
        isBannerOpen: false,
      }
    case 'SHOW_BANNER':
      return { ...state, isBannerOpen: true }
    case 'HIDE_BANNER':
      return { ...state, isBannerOpen: false }
  }
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
  // All consent-related state lives in one reducer, keeping hasConsent,
  // preferences, isBannerOpen, and loading status always in sync.
  const [state, dispatch] = useReducer(cookieConsentReducer, {
    status: 'loading',
    hasConsent: null,
    preferences: { ...defaultPreferences },
    isBannerOpen: false, // Banner stays hidden until localStorage is read
  })

  // Read from localStorage after mount (localStorage is unavailable during SSR).
  // A single INIT dispatch replaces the three separate state setters, so
  // there is no risk of the banner/loading state diverging from the consent value.
  useEffect(() => {
    try {
      const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY)
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY)

      let hasConsent: boolean | null = null
      if (savedConsent !== null) {
        const parsedConsent = safeJsonParse<unknown>(savedConsent)

        if (typeof parsedConsent === 'boolean') {
          hasConsent = parsedConsent
        } else {
          logger.warn({ savedConsent }, 'Invalid saved cookie consent value, reopening banner')
        }
      }

      const preferences = ((): CookiePreferences => {
        if (savedPrefs === null) return { ...defaultPreferences }

        const raw = safeJsonParse<Partial<CookiePreferences>>(savedPrefs)
        if (raw === null) {
          logger.warn({ savedPrefs }, 'Invalid saved cookie preferences, resetting to defaults')
          return { ...defaultPreferences }
        }

        return ensureCookiePreferences(raw)
      })()

      dispatch({ type: 'INIT', hasConsent, preferences })
    } catch (err) {
      logger.error({ err }, 'Error loading cookie preferences from localStorage')
      // Dispatch INIT with defaults so status transitions out of 'loading'
      dispatch({ type: 'INIT', hasConsent: null, preferences: { ...defaultPreferences } })
    }
  }, [])

  const savePreferences = useCallback(async (preferences: CookiePreferences, consent: boolean) => {
    try {
      const validPrefs = ensureCookiePreferences(preferences)

      localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(validPrefs))
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent))

      dispatch({ type: 'SAVE', hasConsent: consent, preferences: validPrefs })

      logger.debug({ preferences: validPrefs, consent }, 'Cookie preferences saved')
    } catch (err) {
      logger.error({ err }, 'Failed to save cookie preferences')
      throw err
    }
  }, [])

  const acceptAll = useCallback(async () => {
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
    async (prefs: Partial<CookiePreferences>) => {
      const newPreferences = {
        ...state.preferences,
        ...prefs,
        necessary: true, // Always keep necessary cookies enabled
      }
      await savePreferences(newPreferences, true)
    },
    [savePreferences, state.preferences]
  )

  const decline = useCallback(async () => {
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

  const showBanner = useCallback(() => {
    dispatch({ type: 'SHOW_BANNER' })
  }, [])

  const hideBanner = useCallback(() => {
    dispatch({ type: 'HIDE_BANNER' })
  }, [])

  return {
    hasConsent: state.hasConsent,
    preferences: state.preferences,
    isBannerOpen: state.isBannerOpen,
    isLoading: state.status === 'loading',
    acceptAll,
    acceptSelected,
    decline,
    showBanner,
    hideBanner,
  }
}
