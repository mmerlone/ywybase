'use client'

import { useQuery } from '@tanstack/react-query'
import { type ICountry } from 'country-state-city'

import { QUERY_CONFIG, QUERY_KEYS } from '@/config/query'
import { logger } from '@/lib/logger/client'
import { detectUserCountry } from '@/lib/utils/location-utils'

/**
 * Return type for the `useGeoLocation` hook.
 */
export interface UseGeoLocationReturn {
  /** The full country object detected from the user's IP/locale/timezone, or null. */
  detectedCountry: ICountry | null
  /** ISO 3166-1 alpha-2 code of the detected country (e.g. `"US"`), or null. */
  detectedCountryCode: string | null
  /** True while the detection request is in-flight. */
  isDetecting: boolean
}

/**
 * Detect the user's country in the background using IP geolocation, browser
 * locale, and timezone-based fallbacks.
 *
 * The result is cached via React Query so every component in the page that
 * calls this hook shares a single request and a single cached value.
 * Detection starts immediately on mount so that by the time the user opens a
 * country dropdown the value is already available.
 *
 * Usage:
 * ```tsx
 * const { detectedCountry, detectedCountryCode, isDetecting } = useGeoLocation()
 * ```
 *
 * @returns {UseGeoLocationReturn} Detected country data and loading state.
 */
export function useGeoLocation(): UseGeoLocationReturn {
  const { data, isLoading } = useQuery<ICountry | null>({
    queryKey: QUERY_KEYS.geoLocation(),
    queryFn: async (): Promise<ICountry | null> => {
      try {
        return await detectUserCountry()
      } catch (err: unknown) {
        logger.warn(
          { err: err instanceof Error ? err : new Error(String(err)), op: 'useGeoLocation' },
          'Failed to detect user country'
        )
        return null
      }
    },
    staleTime: QUERY_CONFIG.geoLocation.staleTime,
    gcTime: QUERY_CONFIG.geoLocation.gcTime,
    // Never retry geolocation failures — the error is almost always a missing
    // API key or network issue that won't resolve on retry.
    retry: false,
    // Allow detection in the background even when the window is blurred.
    refetchOnWindowFocus: false,
  })

  return {
    detectedCountry: data ?? null,
    detectedCountryCode: data?.isoCode ?? null,
    isDetecting: isLoading,
  }
}
